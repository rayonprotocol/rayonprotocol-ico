import { advanceBlock } from 'openzeppelin-solidity/test/helpers/advanceToBlock';
import { increaseTimeTo, duration } from 'openzeppelin-solidity/test/helpers/increaseTime';
import { latestTime } from 'openzeppelin-solidity/test/helpers/latestTime';
import { ether } from '../../contracts/util/ether';

const RefundablePostDeliveryMintedCrowdsale = artifacts.require('RefundablePostDeliveryMintedCrowdsaleImpl');
const MintableToken = artifacts.require('MintableToken.sol');
const BigNumber = web3.BigNumber;


require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

contract('RefundablePostDeliveryMintedCrowdsale', function (accounts) {
  const [owner, nonOwner, beneficiary, beneficiary2, nonbeneficiary] = accounts;
  const rate = 500;
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
    crowdsale = await RefundablePostDeliveryMintedCrowdsale.new(openingTime, closingTime, rate, owner, token.address, crowdsaleSoftCap);
    await token.transferOwnership(crowdsale.address);
  })

  describe('1. FINALIZE', async function () {
    context('1.1 when sale is not closed', async function () {
      beforeEach(async function () {
        await increaseTimeTo(afterOpeningTime);
      });

      it('cannot finalizes', async function () {
        await crowdsale.finalize().should.be.rejectedWith(/revert/);
        crowdsale.isFinalized().should.eventually.be.false;
      });
    });

    context('1.2 when sale is closed', async function () {
      beforeEach(async function () {
        await increaseTimeTo(afterClosingTime);
      });

      it('can finalize', async function () {
        await crowdsale.finalize().should.be.fulfilled;
        crowdsale.isFinalized().should.eventually.be.true;
      });

      it('cannot finalize by non-owner', async function () {
        await crowdsale.finalize({ from: nonOwner }).should.be.rejectedWith(/revert/);
      });
    });
  });

  describe('2. WITHDRAW TOKENS', async function () {
    let purchaseValue;
    let expectedTokenBalance;

    beforeEach(async function () {
      await increaseTimeTo(afterOpeningTime);
    });

    context('2.1 sale is closed with softcap reached', async function () {
      beforeEach(async function () {
        purchaseValue = crowdsaleSoftCap;
        expectedTokenBalance = purchaseValue.mul(rate);
        await crowdsale.sendTransaction({ value: purchaseValue, from: beneficiary }).should.be.fulfilled;
        await increaseTimeTo(afterClosingTime);
      });

      it('cannot withdraw before sale is finalized', async function () {
        await crowdsale.withdrawTokens({ from: beneficiary }).should.be.rejectedWith(/revert/);;
      });

      it('beneficiary can withdraw tokens after sale is finalized', async function () {
        await crowdsale.finalize().should.be.fulfilled;
        const { logs } = await crowdsale.withdrawTokens({ from: beneficiary }).should.be.fulfilled;
        const [log] = logs;
        log.event.should.be.equal('LogWithdrawTokens');
        log.args.beneficiary.should.be.equal(beneficiary);

        const tokenBalance = await token.balanceOf(beneficiary);
        tokenBalance.should.be.bignumber.equal(expectedTokenBalance);
      });

      it('beneficiary cannot withdraw tokens again', async function () {
        await crowdsale.finalize().should.be.fulfilled;
        await crowdsale.withdrawTokens({ from: beneficiary }).should.be.fulfilled;
        await crowdsale.withdrawTokens({ from: beneficiary }).should.be.rejectedWith(/revert/);
      });

      it('non-beneficiary cannot withdraw tokens', async function () {
        await crowdsale.finalize().should.be.fulfilled;
        await crowdsale.withdrawTokens({ from: nonbeneficiary }).should.be.rejectedWith(/revert/);
        await crowdsale.withdrawTokens({ from: beneficiary }).should.be.fulfilled;
      });
    });

    context('2.2 sale is closed with softcap not reached', async function () {
      beforeEach(async function () {
        purchaseValue = crowdsaleSoftCap.dividedToIntegerBy(10);
        expectedTokenBalance = purchaseValue.mul(rate);
        await crowdsale.sendTransaction({ value: purchaseValue, from: beneficiary }).should.be.fulfilled;
        await increaseTimeTo(afterClosingTime);
      });

      it('cannot withdraw token before sale is finalized', async function () {
        await crowdsale.withdrawTokens({ from: beneficiary }).should.be.rejectedWith(/revert/);
      });

      it('cannot withdraw token withdrawal after sale is finalized', async function () {
        await crowdsale.finalize().should.be.fulfilled;
        await crowdsale.withdrawTokens({ from: beneficiary }).should.be.rejectedWith(/revert/);
      });
    });
  });

});
