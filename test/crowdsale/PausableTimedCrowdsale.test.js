import moment from 'moment-timezone';
import { advanceBlock } from 'openzeppelin-solidity/test/helpers/advanceToBlock';
import { increaseTimeTo, duration } from 'openzeppelin-solidity/test/helpers/increaseTime';
import { latestTime } from 'openzeppelin-solidity/test/helpers/latestTime';
import assertTimeWithinTolerance from '../util/assertTimeWithinTolerance';

const PausableTimedCrowdsale = artifacts.require('PausableTimedCrowdsaleImpl');
const MintableToken = artifacts.require('MintableToken.sol');
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

const ether = (n) => new BigNumber(web3.toWei(n, 'ether'));

contract('PausableTimedCrowdsale', function (accounts) {

  const [owner, nonOwner] = accounts;
  const rate = 500;
  const wallet = owner;
  const tokenSupply = new BigNumber('1e25');
  const value = ether(1);

  let crowdsale;
  let openingTime;
  let afterOpeningTime;
  let closingTime;
  let afterClosingTime;
  let token;

  async function pauseFor(pausingDuration) {
    const paused = await crowdsale.paused();
    if (!paused) await crowdsale.pause();
    const pausedTime = await crowdsale.pausedTime();
    await increaseTimeTo(pausedTime.plus(pausingDuration));
    await crowdsale.unpause();
  };

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await advanceBlock();
  });

  beforeEach(async function () {
    const currentTime = await latestTime();
    // Setup time
    openingTime = currentTime + duration.days(1);
    afterOpeningTime = openingTime + duration.seconds(5);
    closingTime = openingTime + duration.weeks(12);
    afterClosingTime = closingTime + duration.seconds(5);
    // Token and Crowdsale
    token = await MintableToken.new();
    crowdsale = await PausableTimedCrowdsale.new(
      openingTime, closingTime, rate, wallet, token.address,
    );
    // Mint as much as tokenSupply
    await token.mint(crowdsale.address, tokenSupply);
  });

  describe('SALE PAUSE', async function () {

    context('when sale is not opened yet', async function () {
      it('can not pause', async function () {
        await crowdsale.pause().should.be.rejectedWith(/revert/);
      });
    })

    context('when  sale is opened', async function () {
      beforeEach(async function () {
        // make sale opened
        await increaseTimeTo(afterOpeningTime);
      });

      it('pauses crowdsale', async function () {
        await crowdsale.pause().should.be.fulfilled;
        crowdsale.paused().should.eventually.be.true;
      });

      it('sets paused time', async function () {
        // pausedTime must be 0 before pause
        const pausedTimeBeforePause = await crowdsale.pausedTime();
        pausedTimeBeforePause.should.be.bignumber.equal(0);

        await crowdsale.pause().should.be.fulfilled;
        const blockTimeWhenPaused = await latestTime();

        // pausedTime must be same with the block time when paused
        const pausedTimeAfterPause = await crowdsale.pausedTime();
        pausedTimeAfterPause.should.be.bignumber.equal(blockTimeWhenPaused);
      });

      it('can not unpause crowdsale that already has been paused', async function () {
        await crowdsale.pause();
        // try pause after pause;
        await crowdsale.pause().should.be.rejectedWith(/revert/);
      });

      it('reverts pause by non-owner', async function () {
        await crowdsale.pause({ from: nonOwner }).should.be.rejectedWith(/revert/);
      });
    });
  });

  describe('SALE UNPAUSE', async function () {
    context('when sale is paused', async function () {
      beforeEach(async function () {
        await increaseTimeTo(afterOpeningTime);
        await crowdsale.pause();
      });

      it('unpauses crowdsale', async function () {
        await crowdsale.unpause().should.be.fulfilled;
        const paused = await crowdsale.paused();
        paused.should.be.false;
      });

      it('unpauses crowdsale after currently-set closingTime is passed', async function () {
        const closingTime = await crowdsale.closingTime();
        await increaseTimeTo(closingTime.add(duration.seconds(1))); // currently-set closingTime is passed

        await crowdsale.unpause().should.be.fulfilled;
      });

      it('can not unpause crowdsale after unpaused', async function () {
        await crowdsale.unpause().should.be.fulfilled;
        await crowdsale.unpause().should.be.rejectedWith(/revert/);
      });

      it('extends closingTime on unpause', async function () {
        let accumulatedDuration = new BigNumber(0);
        const pausingDuration = duration.hours(20);
        const closingTimeBeforePauses = await crowdsale.closingTime();
        const count = 10;
        for (let i = 0; i < count; i++) {
          await pauseFor(pausingDuration);
          accumulatedDuration = accumulatedDuration.plus(pausingDuration);
        }
        const extendedClosingTime = await crowdsale.closingTime();
        assertTimeWithinTolerance(extendedClosingTime, closingTimeBeforePauses.plus(accumulatedDuration));
      });

      it('emits LogExtendClosingTime event', async function () {
        const pausingDuration = duration.seconds(20);
        const pausedTime = await crowdsale.pausedTime();
        await increaseTimeTo(pausedTime.plus(pausingDuration));
        const { logs } = await crowdsale.unpause();
        const [, secondLog] = logs;
        secondLog.event.should.be.equal('LogExtendClosingTime');
        const pausedDuration = secondLog.args.pausedDuration;
        assertTimeWithinTolerance(pausedDuration, pausingDuration);
      });

      it('reverts unpause by non-owner', async function () {
        await crowdsale.unpause({ from: nonOwner }).should.be.rejectedWith(/revert/);
      });
    });

    context('when sale is not paused', async function () {
      it('can not unpause when crowdsale is not paused', async function () {
        await crowdsale.unpause().should.be.rejectedWith(/revert/);
      });
    });
  });

  describe('sale closing', async function () {
    beforeEach(async function () {
      await increaseTimeTo(afterOpeningTime);
    });

    it('checks sale close when it has never been paused and unpaused', async function () {
      await increaseTimeTo(afterClosingTime);
      const closed = await crowdsale.hasClosed();
      closed.should.be.true;
    });

    it('check sale close when in paused and closingTime is passed', async function() {
      await crowdsale.pause();
      const closingTime = await crowdsale.closingTime();
      const pausingDuration = duration.minutes(60);
      await increaseTimeTo(closingTime.plus(pausingDuration)); // crowdsale is still in paused and closingTime is passed
      const closed = await crowdsale.hasClosed();
      
      closed.should.be.false;
    });

    it('checks sale close when it has been paused and unpaused', async function () {
      const pausingDuration = duration.minutes(60);
      await pauseFor(pausingDuration);

      // initial closingTime is passed
      await increaseTimeTo(afterClosingTime);
      const closed = await crowdsale.hasClosed();
      closed.should.be.false;

      // extended closingTime is passed
      await increaseTimeTo(afterClosingTime + pausingDuration);
      const closedAfterDuration = await crowdsale.hasClosed();
      closedAfterDuration.should.be.true;
    });
  });


  describe('accepting payments', function () {
    const [, purchaser, investor] = accounts;

    it('should reject payments before sale open', async function () {
      await crowdsale.send(value).should.be.rejectedWith(/revert/);
      await crowdsale.buyTokens(investor, { from: purchaser, value: value }).should.be.rejectedWith(/revert/);
    });

    it('should accept payments after open', async function () {
      await increaseTimeTo(afterOpeningTime);
      await crowdsale.sendTransaction({ value }).should.be.fulfilled;
      await crowdsale.buyTokens(investor, { value, from: investor }).should.be.fulfilled;
    });

    it('should reject payments when opened and being paused', async function () {
      await increaseTimeTo(afterOpeningTime);
      await crowdsale.pause();
      await crowdsale.send(value).should.be.rejectedWith(/revert/);
      await crowdsale.buyTokens(investor, { value: value, from: purchaser }).should.be.rejectedWith(/revert/);
    });

    it('should accept payments when opened and paused duration left', async function () {
      await increaseTimeTo(afterOpeningTime);
      const pausingDuration = duration.days(10);
      await pauseFor(pausingDuration);
      await crowdsale.send(value).should.be.fulfilled;
      await crowdsale.buyTokens(investor, { value: value, from: purchaser }).should.be.fulfilled;
    });

    it('should reject payments when ended', async function () {
      await crowdsale.send(value).should.be.rejectedWith(/revert/);
      await crowdsale.buyTokens(investor, { value: value, from: purchaser }).should.be.rejectedWith(/revert/);
    });
  });
});
