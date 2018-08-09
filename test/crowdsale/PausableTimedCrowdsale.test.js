import moment from 'moment-timezone';
import { advanceBlock } from 'openzeppelin-solidity/test/helpers/advanceToBlock';
import { increaseTimeTo, duration } from 'openzeppelin-solidity/test/helpers/increaseTime';
import { latestTime } from 'openzeppelin-solidity/test/helpers/latestTime';
const PausableTimedCrowdsale = artifacts.require('PausableTimedCrowdsaleMock');
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


  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await advanceBlock();
  });

  beforeEach(async function () {
    // await advanceBlock();
    const blockTime = await latestTime();
    this.openingTime = blockTime + duration.days(1);
    this.afterOpeningTime = this.openingTime + duration.seconds(1);
    this.closingTime = this.openingTime + duration.weeks(12);
    this.afterClosingTime = this.closingTime + duration.seconds(1);
    this.token = await MintableToken.new();
    this.crowdsale = await PausableTimedCrowdsale.new(
      this.openingTime, this.closingTime, rate, wallet, this.token.address,
    );
    await this.token.mint(this.crowdsale.address, tokenSupply);
    this.unpauseAfterDuration = async (pausingDuration) => {
      const pausedTime = await this.crowdsale.pausedTime();
      await this.crowdsale.mockSetTimestamp(pausedTime.plus(pausingDuration));
      await this.crowdsale.unpause();
      await this.crowdsale.mockSetTimestamp(0);
    };
  });

  describe('sale pause', async function () {
    context('when the sender is the crowdsale owner', async function () {
      context('and sale is opened', async function () {
        beforeEach(async function () {
          await increaseTimeTo(this.afterOpeningTime);
        });

        it('pauses crowdsale', async function () {
          await this.crowdsale.pause().should.be.fulfilled;
          this.crowdsale.paused().should.eventually.be.true;
        });

        it('sets paused time', async function () {
          const pausedTimeBeforePause = await this.crowdsale.pausedTime();
          pausedTimeBeforePause.should.be.bignumber.equal(0);

          await this.crowdsale.pause().should.be.fulfilled;
          const blocklatestTime = await latestTime();

          const pausedTimeAfterPause = await this.crowdsale.pausedTime();
          pausedTimeAfterPause.should.be.bignumber.equal(blocklatestTime);
        });

        it('can not pause crowdsale that already has been paused', async function () {
          await this.crowdsale.pause().should.be.fulfilled;
          await this.crowdsale.pause().should.be.rejectedWith(/revert/);
        });
      });

      context('and sale is not opened yet', async function () {
        it('reverts', async function () {
          await this.crowdsale.pause().should.be.rejectedWith(/revert/);
        });
      })
    });

    context('when the sender is not the crowdsale owner', async function () {
      it('reverts', async function () {
        await this.crowdsale.pause({ from: nonOwner }).should.be.rejectedWith(/revert/);
      });
    });
  });

  describe('sale unpause', async function () {

    context('when the sender is the crowdsale owner', async function () {
      context('and sale is paused', async function () {
        beforeEach(async function () {
          await increaseTimeTo(this.afterOpeningTime);
          await this.crowdsale.pause();
        });
        it('unpauses crowdsale', async function () {
          await this.crowdsale.unpause().should.be.fulfilled;
          this.crowdsale.paused().should.eventually.be.false;
        });

        it('can not unpause crowdsale that already has been unpaused', async function () {
          await this.crowdsale.unpause().should.be.fulfilled;
          await this.crowdsale.unpause().should.be.rejectedWith(/revert/);
        });

        it('can not unpause crowdsale that already has been unpaused', async function () {
          await this.crowdsale.unpause().should.be.fulfilled;
          await this.crowdsale.unpause().should.be.rejectedWith(/revert/);
        });

        it('increases total paused duration', async function () {
          const pausingDuration = duration.hours(20);
          const count = 10;
          for (let i = 0; i < count; i++) {
            await this.unpauseAfterDuration(pausingDuration);
            await this.crowdsale.pause();
          }
          const totalPausedDuration = await this.crowdsale.totalPausedDuration();
          totalPausedDuration.should.be.bignumber.equal(pausingDuration * count);
        });

        it('emits IncreaseTotalPausedDuration event', async function () {
          await this.crowdsale.mockSetPausedTime(this.afterOpeningTime);
          const pausingDuration = duration.seconds(20);
          await this.crowdsale.mockSetTimestamp(this.afterOpeningTime + pausingDuration);
          const { logs } = await this.crowdsale.unpause();
          const [, secondLog] = logs;
          secondLog.event.should.be.equal('IncreaseTotalPausedDuration');
          secondLog.args.pausedDuration.should.be.bignumber.equal(pausingDuration);
        });
      });
      context('and sale is not paused', async function () {
        it('reverts', async function () {
          await this.crowdsale.unpause().should.be.rejectedWith(/revert/);
        });
      })
    });

    context('when the sender is not the crowdsale owner', async function () {
      it('reverts', async function () {
        await this.crowdsale.unpause({ from: nonOwner }).should.be.rejectedWith(/revert/);
      });
    });
  });

  describe('sale closing', async function () {
    beforeEach(async function () {
      await increaseTimeTo(this.afterOpeningTime);
    });

    it('checks sale close when it has never been paused and unpaused', async function () {
      await increaseTimeTo(this.afterClosingTime);
      const closed = await this.crowdsale.hasClosed();
      closed.should.be.true;
    });

    it('checks sale close when it has been paused and unpaused', async function () {
      const pausingDuration = duration.seconds(60);
      await this.crowdsale.pause();
      await this.crowdsale.mockSetPausedTime(this.afterOpeningTime);
      await this.crowdsale.mockSetTimestamp(this.afterOpeningTime + pausingDuration);
      await this.crowdsale.unpause();
      await this.crowdsale.mockSetTimestamp(0); // set zero not to use mockTime

      await increaseTimeTo(this.afterClosingTime);
      const closed = await this.crowdsale.hasClosed();
      closed.should.be.false;

      await increaseTimeTo(this.afterClosingTime + pausingDuration);
      const closedAfterDuration = await this.crowdsale.hasClosed();
      closedAfterDuration.should.be.true;
    });
  });


  describe('accepting payments', function () {
    const [, purchaser, investor] = accounts;

    it('should reject payments before sale open', async function () {
      await this.crowdsale.send(value).should.be.rejectedWith(/revert/);
      await this.crowdsale.buyTokens(investor, { from: purchaser, value: value }).should.be.rejectedWith(/revert/);
    });

    it('should accept payments after open', async function () {
      await increaseTimeTo(this.afterOpeningTime);
      await this.crowdsale.sendTransaction({ value }).should.be.fulfilled;
      await this.crowdsale.buyTokens(investor, { value, from: investor }).should.be.fulfilled;
    });

    it('should reject payments when opened and being paused', async function () {
      await increaseTimeTo(this.afterOpeningTime);
      await this.crowdsale.pause();
      await this.crowdsale.send(value).should.be.rejectedWith(/revert/);
      await this.crowdsale.buyTokens(investor, { value: value, from: purchaser }).should.be.rejectedWith(/revert/);
    });

    it('should accept payments when opened and paused duration left', async function () {
      await increaseTimeTo(this.afterOpeningTime);
      await this.crowdsale.pause();
      const pausingDuration = duration.days(10);
      await this.unpauseAfterDuration(pausingDuration);
      await this.crowdsale.send(value).should.be.fulfilled;
      await this.crowdsale.buyTokens(investor, { value: value, from: purchaser }).should.be.fulfilled;
    });


    it('should reject payments when ended', async function () {
      await this.crowdsale.send(value).should.be.rejectedWith(/revert/);
      await this.crowdsale.buyTokens(investor, { value: value, from: purchaser }).should.be.rejectedWith(/revert/);
    });
  });
});
