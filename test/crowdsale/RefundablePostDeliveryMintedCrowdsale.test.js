import { advanceBlock } from 'openzeppelin-solidity/test/helpers/advanceToBlock';
import { increaseTimeTo, duration } from 'openzeppelin-solidity/test/helpers/increaseTime';
import { latestTime } from 'openzeppelin-solidity/test/helpers/latestTime';

const RefundablePostDeliveryMintedCrowdsale = artifacts.require('RefundablePostDeliveryMintedCrowdsaleImpl');
const MintableToken = artifacts.require('MintableToken.sol');
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

const ether = (n) => new BigNumber(web3.toWei(n, 'ether'));

contract('RefundablePostDeliveryMintedCrowdsale', function (accounts) {
  const [owner, nonOwner, beneficiary] = accounts;
  const rate = 500;
  const wallet = owner;
  const tokenSupply = new BigNumber('1e25');
  const crowdsaleSoftCap = ether(50);

  let crowdsale;
  let openingTime;
  let afterOpeningTime;
  let closingTime;
  let afterClosingTime;
  let token;

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await advanceBlock();
  });

  beforeEach(async function () {
    const latestBlockTime = await latestTime();
    // Setup time
    openingTime = latestBlockTime + duration.days(1);
    afterOpeningTime = openingTime + duration.seconds(5);
    closingTime = openingTime + duration.weeks(12);
    afterClosingTime = closingTime + duration.seconds(5);
    // Token and Crowdsale
    token = await MintableToken.new(tokenSupply);
    crowdsale = await RefundablePostDeliveryMintedCrowdsale.new(
      openingTime, closingTime, rate, wallet, token.address, crowdsaleSoftCap
    );
    await token.transferOwnership(crowdsale.address);
  })

  describe('finalize', async function () {
    context('when sale is closed', async function () {
      beforeEach(async function () {
        await increaseTimeTo(afterClosingTime);
      });

      it('finalizes', async function () {
        await crowdsale.finalize().should.be.fulfilled;
        const finalized = await crowdsale.isFinalized();
        finalized.should.be.true;
      });

      it('reverts finalization by non-owner', async function () {
        await crowdsale.finalize({ from: nonOwner }).should.be.rejectedWith(/revert/);
      });
    });

    it('reverts finalization before sale close', async function () {
      await crowdsale.finalize().should.be.rejectedWith(/revert/);
    });
  });

  describe('withdrawTokens', async function () {
    context('when beneficiary purchases tokens', async function () {
      let value;
      let expectedTokenBalance;

      beforeEach(async function () {
        await increaseTimeTo(afterOpeningTime);
      });

      context('and sale is closed with softcap reach', async function () {
        beforeEach(async function () {
          value = crowdsaleSoftCap;
          expectedTokenBalance = value.mul(rate);
          await crowdsale.sendTransaction({ value, from: beneficiary }).should.be.fulfilled;
          await increaseTimeTo(afterClosingTime);
        });

        it('lets beneficiary withdraw tokens after sale is finalized', async function () {
          await crowdsale.finalize().should.be.fulfilled;
          const { logs }  = await crowdsale.withdrawTokens({ from: beneficiary }).should.be.fulfilled;
          const [log] = logs;
          log.event.should.be.equal('LogWithdrawTokens');
          log.args.beneficiary.should.be.equal(beneficiary);

          const tokenBalance = await token.balanceOf(beneficiary);
          tokenBalance.should.be.bignumber.equal(expectedTokenBalance);
        });

        it('reverts token withdrawal by beneficiary before sale is finalized', async function () {
          await crowdsale.withdrawTokens({ from: beneficiary }).should.be.rejectedWith(/revert/);;
        });
      });

      context('and sale is closed with softcap reach failure', async function () {
        beforeEach(async function () {
          value = crowdsaleSoftCap.dividedToIntegerBy(10);
          expectedTokenBalance = value.mul(rate);
          await crowdsale.sendTransaction({ value, from: beneficiary }).should.be.fulfilled;
          await increaseTimeTo(afterClosingTime);
        });

        it('reverts token withdrawal by beneficiary after sale is finalized', async function () {
          await crowdsale.finalize();
          await crowdsale.withdrawTokens({ from: beneficiary }).should.be.rejectedWith(/revert/);
        });

        it('reverts token withdrawal before sale is finalized', async function () {
          await crowdsale.withdrawTokens({ from: beneficiary }).should.be.rejectedWith(/revert/);
        });
      });

      it('reverts token withdrawal before sale close', async function () {
        await crowdsale.withdrawTokens({ from: beneficiary }).should.be.rejectedWith(/revert/);;
      });
    });

  });
});
