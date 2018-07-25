const moment = require('moment-timezone');
const RayonToken = artifacts.require('RayonToken');
const RayonTokenCrowdsale = artifacts.require('RayonTokenCrowdsale');
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const epochTimestamp = (year, month, date, hour = 0, minute = 0) => moment()
  .tz('Asia/Seoul') // KST
  .set({ year, month: month - 1, date, hour, minute }) // refine month to be in range from 0 to 11.
  .unix();

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const ether = (n) => new BigNumber(web3.toWei(n, 'ether'));

const getEthBalance = (address) => web3.eth.getBalance(address);

contract('RayonTokenCrowdsale', function (accounts) {
  const [owner, beneficiary] = accounts;
  const rate = 500;
  const wallet = owner;
  const cap = ether(3000);
  
  beforeEach(async function () {
    const openingTime = epochTimestamp(2018, 7, moment().date(), moment().hour(), moment().minute()) + 15;
    const closingTime = epochTimestamp(2018, 7, 29, 12, 0);
    this.token = await RayonToken.new();
    this.crowdsale = await RayonTokenCrowdsale.new(rate, wallet, this.token.address, cap, openingTime, closingTime);
    await this.token.transferOwnership(this.crowdsale.address).catch(console.log);
    await this.crowdsale.addAddressToWhitelist(beneficiary).catch(console.log);
  });

  describe('valid sale', function () {
    it('is not reached cap', async function () {
      (await this.crowdsale.capReached()).should.be.false;
    });

    it('is opened', async function () {
      (await this.crowdsale.hasClosed()).should.be.false;
    });

    it('verifies whiltelistee', async function () {
      (await this.crowdsale.whitelist(beneficiary)).should.be.true;
    });
  });

  describe('token purchase', function () {
    beforeEach(() => wait(1000 * 15));

    it('assigns tokens to beneficiary', async function () {
      const value = ether(5);
      await this.crowdsale.sendTransaction({ value, from: beneficiary }).should.be.fulfilled;

      const tokenBalance = await this.token.balanceOf(beneficiary, { from: beneficiary });
      tokenBalance.should.be.bignumber.equal(value.mul(rate));
    });

    it('forwards funds to wallet', async function () {
      const value = ether(5);
      const balanceBeforeForward = await getEthBalance(wallet);
      await this.crowdsale.sendTransaction({ value, from: beneficiary }).should.be.fulfilled;
      
      const balanceAfterForward = await getEthBalance(wallet);
      balanceAfterForward.should.be.bignumber.equal(balanceBeforeForward.plus(value));
    });
  });

  describe('ownership', function () {
    it('returns token ownership to owner', async function () {
      (await this.token.owner()).should.be.equal(this.crowdsale.address);

      await this.crowdsale.reclaimContract(this.token.address);
      (await this.token.owner()).should.be.equal(owner);
    });
  });
});
