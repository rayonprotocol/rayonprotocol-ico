import { ether } from '../../contracts/util/ether';

const PurchaseLimitedCrowdsale = artifacts.require('PurchaseLimitedCrowdsaleImpl');
const MintableToken = artifacts.require('MintableToken.sol');
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

contract('PurchaseLimitedCrowdsale', function (accounts) {
  const [owner, purchaser1, purchaser2] = accounts;
  const rate = 500;
  const tokenSupply = new BigNumber('1e25');

  const minimumLimit = ether(2);
  const maximumLimit = ether(10);
  const possibleValue = ether(4);
  const excessValue = maximumLimit.add(ether(1));
  const underValue = minimumLimit.sub(ether(1));

  let crowdsale;
  let token;

  beforeEach(async function () {
    token = await MintableToken.new();
    crowdsale = await PurchaseLimitedCrowdsale.new(minimumLimit, maximumLimit, rate, owner, token.address);
    await token.mint(crowdsale.address, tokenSupply);
  });

  describe('1. TOTAL PURCHASE AMOUNT', async function () {
    it('accumulates purchase amount', async function () {
      const raisedWeiBeforePurchase = await crowdsale.contributions(purchaser1);
      raisedWeiBeforePurchase.should.be.bignumber.equal(0);

      await crowdsale.sendTransaction({ value: possibleValue, from: purchaser1}).should.be.fulfilled;

      const raisedWeiAfterPurchase = await crowdsale.contributions(purchaser1);
      raisedWeiAfterPurchase.should.be.bignumber.equal(possibleValue);

      await crowdsale.sendTransaction({ value: possibleValue, from: purchaser1}).should.be.fulfilled;

      const raisedWeiAfterSecondPurchase = await crowdsale.contributions(purchaser1);
      raisedWeiAfterSecondPurchase.should.be.bignumber.equal(possibleValue.times(2));
    });
  });

  describe('2. PURCHASE LIMIT', async function () {
    it('accepts the purchase by the minimum amount', async function () {
      await crowdsale.sendTransaction({ value: minimumLimit, from: purchaser1}).should.be.fulfilled;
    });

    it('accepts the purchase by the maximum amount', async function () {
      await crowdsale.sendTransaction({ value: maximumLimit, from: purchaser1}).should.be.fulfilled;
    });

    it('accepts the purchase for amount between minimumLimit and maximumLimit', async function () {
      await crowdsale.sendTransaction({ value: possibleValue, from: purchaser1}).should.be.fulfilled;
    });

    it('rejects the purchase under minimum amount', async function () {
      await crowdsale.sendTransaction({ value: underValue, from: purchaser1}).should.be.rejectedWith(/revert/);
    });

    it('rejects the purchase excessing maximum amount', async function () {
      await crowdsale.sendTransaction({ value: excessValue, from: purchaser1}).should.be.rejectedWith(/revert/);
      await crowdsale.sendTransaction({ value: minimumLimit, from: purchaser1}).should.be.fulfilled;
      await crowdsale.sendTransaction({ value: maximumLimit, from: purchaser1}).should.be.rejectedWith(/revert/);
    });

    it('accept the purchase by a different purchaser', async function () {
      await crowdsale.sendTransaction({ value: maximumLimit, from: purchaser1}).should.be.fulfilled;
      await crowdsale.sendTransaction({ value: possibleValue, from: purchaser1}).should.be.rejectedWith(/revert/);
      // different purchaser
      await crowdsale.sendTransaction({ value: possibleValue, from: purchaser2}).should.be.fulfilled;
    });
  });
});
