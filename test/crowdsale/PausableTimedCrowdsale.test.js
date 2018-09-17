import { advanceBlock } from 'openzeppelin-solidity/test/helpers/advanceToBlock';
import { increaseTimeTo, duration } from 'openzeppelin-solidity/test/helpers/increaseTime';
import { latestTime } from 'openzeppelin-solidity/test/helpers/latestTime';
import assertTimeWithinTolerance from '../util/assertTimeWithinTolerance';
import { ether } from '../../contracts/util/ether';

const PausableTimedCrowdsale = artifacts.require('PausableTimedCrowdsaleImpl');
const MintableToken = artifacts.require('MintableToken.sol');
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

contract('PausableTimedCrowdsale', function (accounts) {

  const [owner, nonOwner] = accounts;
  const rate = 500;
  const tokenSupply = new BigNumber('1e25');
  const oneether = ether(1);

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
    crowdsale = await PausableTimedCrowdsale.new(openingTime, closingTime, rate, owner, token.address);
    // Mint as much as tokenSupply
    await token.mint(crowdsale.address, tokenSupply);
  });

  describe('1. SALE PAUSE', async function () {

    context('1.1 when sale is not opened yet', async function () {
      it('can not pause', async function () {
        await crowdsale.pause().should.be.rejectedWith(/revert/);
      });

      it('can not unpause', async function () {
        await crowdsale.unpause().should.be.rejectedWith(/revert/);
      });

      it('hasClosed is false', async function () {
        crowdsale.hasClosed().should.eventually.be.false;
      });
    })

    context('1.2 when sale is opened', async function () {
      beforeEach(async function () {
        // make sale opened
        await increaseTimeTo(afterOpeningTime);
      });

      it('can pause crowdsale', async function () {
        await crowdsale.pause().should.be.fulfilled;
        crowdsale.paused().should.eventually.be.true;
      });

      it('can not pause crowdsale that already has been paused', async function () {
        await crowdsale.pause().should.be.fulfilled;
        // try pause after pause;
        await crowdsale.pause().should.be.rejectedWith(/revert/);
      });

      it('pausedTime must be same with the blocktime when paused', async function () {
        // pausedTime must be 0 before pause
        const pausedTimeBeforePause = await crowdsale.pausedTime();
        pausedTimeBeforePause.should.be.bignumber.equal(0);

        await crowdsale.pause().should.be.fulfilled;
        const blockTimeWhenPaused = await latestTime();

        await increaseTimeTo(blockTimeWhenPaused + 100);
        // pausedTime must be same with the block time when paused
        const pausedTimeAfterPause = await crowdsale.pausedTime();
        pausedTimeAfterPause.should.be.bignumber.equal(blockTimeWhenPaused);
      });

      it('must not be closed while paused', async function () {
        await crowdsale.pause().should.be.fulfilled;
        await increaseTimeTo(afterClosingTime);
        crowdsale.hasClosed().should.eventually.be.false;
      });

      it('can not pause by non-owner', async function () {
        await crowdsale.pause({ from: nonOwner }).should.be.rejectedWith(/revert/);
        await crowdsale.pause().should.be.fulfilled;
      });
    });
  });

  describe('2. SALE UNPAUSE', async function () {
    context('2.1 when sale is not open', async function () {
      it('can not unpause', async function () {
        await crowdsale.paused().should.eventually.be.false;
        await crowdsale.unpause().should.be.rejectedWith(/revert/);
      });
    });

    context('2.2 when sale is not paused', async function () {
      beforeEach(async function () {
        await increaseTimeTo(afterOpeningTime);
      });

      it('can not unpause when not paused', async function () {
        await crowdsale.paused().should.eventually.be.false;
        await crowdsale.unpause().should.be.rejectedWith(/revert/);
        await crowdsale.pause().should.be.fulfilled;
      });
    });

    context('2.3 when sale is paused', async function () {
      beforeEach(async function () {
        await increaseTimeTo(afterOpeningTime);
        await crowdsale.pause();
      });

      it('can unpause', async function () {
        await crowdsale.paused().should.eventually.be.true;
        await crowdsale.unpause().should.be.fulfilled;
        crowdsale.paused().should.eventually.be.false;
      });

      it('unpauses after currently-set closingTime is passed', async function () {
        const closingTime = await crowdsale.closingTime();
        await increaseTimeTo(closingTime.add(duration.seconds(1))); // currently-set closingTime is passed

        await crowdsale.unpause().should.be.fulfilled;
      });

      it('can not unpause after unpaused', async function () {
        await crowdsale.unpause().should.be.fulfilled;
        await crowdsale.unpause().should.be.rejectedWith(/revert/);
      });

      it('extends closingTime on unpause', async function () {
        let accumulatedDuration = new BigNumber(0);
        const pausingDuration = duration.hours(20);
        const closingTimeBeforePauses = await crowdsale.closingTime();
        for (let i = 0; i < 10; i++) {
          await pauseFor(pausingDuration);
          await advanceBlock();
          accumulatedDuration = accumulatedDuration.plus(pausingDuration);
        }
        const extendedClosingTime = await crowdsale.closingTime();
        assertTimeWithinTolerance(extendedClosingTime, closingTimeBeforePauses.plus(accumulatedDuration), 5);
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

        // check if the newClosingTime attached in the event is same with the closingTime()
        const closingTime = await crowdsale.closingTime();
        assertTimeWithinTolerance(closingTime, secondLog.args.newClosingTime);
      });

      it('can not unpause by non-owner', async function () {
        await crowdsale.unpause({ from: nonOwner }).should.be.rejectedWith(/revert/);
        await crowdsale.unpause().should.be.fulfilled;
      });
    });
  });

  describe('3. SALE CLOSING', async function () {
    beforeEach(async function () {
      await increaseTimeTo(afterOpeningTime);
    });

    it('sale must get closed when it has never been paused and unpaused', async function () {
      await increaseTimeTo(afterClosingTime);
      crowdsale.hasClosed().should.eventually.be.true;
    });

    it('sale must not get closed when paused and closingTime is passed', async function () {
      await crowdsale.pause();
      const originalClosingTime = await crowdsale.closingTime();
      await increaseTimeTo(originalClosingTime); // crowdsale is still in paused and closingTime is passed
      crowdsale.hasClosed().should.eventually.be.false;
    });

    it('sale must get closed when it has been paused and unpaused and the new closingTime is passed', async function () {
      const pausingDuration = duration.minutes(60);
      await pauseFor(pausingDuration);

      // initial closingTime is passed
      await increaseTimeTo(afterClosingTime);
      await crowdsale.hasClosed().should.eventually.be.false;

      // extended closingTime is passed
      await increaseTimeTo(afterClosingTime + pausingDuration);
      crowdsale.hasClosed().should.eventually.be.true;
    });
  });


  describe('4. ACCEPTING PAYMENTS', function () {
    const [, purchaser, investor] = accounts;

    context('4.1 when sale is not opened yet', async function () {
      it('should reject payments before sale open', async function () {
        await crowdsale.send(oneether).should.be.rejectedWith(/revert/);
        await crowdsale.buyTokens(investor, { from: purchaser, value: oneether }).should.be.rejectedWith(/revert/);
      });
    })

    context('4.2 when sale is opened', async function () {
      beforeEach(async function () {
        // make sale opened
        await increaseTimeTo(afterOpeningTime);
      });

      it('should accept payments after open', async function () {
        await crowdsale.sendTransaction({ value: oneether }).should.be.fulfilled;
        await crowdsale.buyTokens(investor, { value: oneether, from: investor }).should.be.fulfilled;
      });

      it('should reject payments when opened and being paused', async function () {
        await crowdsale.pause().should.be.fulfilled;
        await crowdsale.send(oneether).should.be.rejectedWith(/revert/);
        await crowdsale.buyTokens(investor, { value: oneether, from: purchaser }).should.be.rejectedWith(/revert/);
      });

      it('should accept payments when opened and paused duration left', async function () {
        const pausingDuration = duration.days(10);
        await pauseFor(pausingDuration);
        await crowdsale.send(oneether).should.be.fulfilled;
        await crowdsale.buyTokens(investor, { value: oneether, from: purchaser }).should.be.fulfilled;
      });

      it('should reject payments when ended', async function () {
        await increaseTimeTo(afterClosingTime);
        await crowdsale.send(oneether).should.be.rejectedWith(/revert/);
        await crowdsale.buyTokens(investor, { value: oneether, from: purchaser }).should.be.rejectedWith(/revert/);
      });

      it('should reject payments when opened and paused and newClosingTime is passed', async function () {
        const pausingDuration = duration.days(10);
        await pauseFor(pausingDuration);
        await increaseTimeTo(afterClosingTime + pausingDuration);
        await crowdsale.send(oneether).should.be.rejectedWith(/revert/);
        await crowdsale.buyTokens(investor, { value: oneether, from: purchaser }).should.be.rejectedWith(/revert/);
      });

    });
  });
});
