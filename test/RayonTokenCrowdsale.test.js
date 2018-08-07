const moment = require('moment-timezone');
const RayonToken = artifacts.require('RayonToken');
const RayonTokenCrowdsale = artifacts.require('RayonTokenCrowdsaleMock');
const BigNumber = web3.BigNumber;

require('chai')
.use(require('chai-bignumber')(BigNumber))
.use(require('chai-as-promised'))
  .should();

const ether = (n) => new BigNumber(web3.toWei(n, 'ether'));
const tokenToWei = n => (new BigNumber(10)).pow(18).times(n);

const getEthBalance = (address) => web3.eth.getBalance(address);

contract('RayonTokenCrowdsale', function (accounts) {
  const [owner, beneficiary, newOwner] = accounts;
  const rate = 500;
  const wallet = owner;
  const tokenCap = tokenToWei(5000);
  const crowdsaleCap = ether(3000);

  beforeEach(async function () {
    const openingTime = moment().add(7, 'seconds').unix();
    const closingTime = moment('2099-12-31').unix();
    this.token = await RayonToken.new(tokenCap);
    this.crowdsale = await RayonTokenCrowdsale.new(rate, wallet, this.token.address, crowdsaleCap, openingTime, closingTime);
    await this.token.transferOwnership(this.crowdsale.address);
    await this.crowdsale.claimContractOwnership(this.token.address);
    await this.crowdsale.addAddressToWhitelist(beneficiary);
  });

  describe('valid sale', function () {
    it('is not reached cap', async function () {
      await this.crowdsale.capReached().should.eventually.be.false;
    });

    it('is opened', async function () {
      await this.crowdsale.hasClosed().should.eventually.be.false;
    });

    it('verifies whiltelistee', async function () {
      await this.crowdsale.whitelist(beneficiary).should.eventually.be.true;
    });
  });

  describe('token purchase', function () {
    beforeEach(async function () {
      // mocking sale opened
      await this.crowdsale.mockSetOpeningTime(moment().unix());
    });

    it(`doesn't immediately assign tokens to beneficiary`, async function () {
      const value = ether(5);
      const expectedLockedTokenBalance = value.mul(rate);
      await this.crowdsale.sendTransaction({ value, from: beneficiary }).should.be.fulfilled;

      const tokenBalance = await this.token.balanceOf(beneficiary);
      tokenBalance.should.be.bignumber.equal(0);
      const lockedTokenBalance = await this.crowdsale.balances(beneficiary)
      lockedTokenBalance.should.bignumber.be.equal(expectedLockedTokenBalance);
    });

    it('assigns tokens when beneficiary claims after sale close', async function () {
      const value = ether(5);
      const expectedTokenBalance = value.mul(rate);
      await this.crowdsale.sendTransaction({ value, from: beneficiary }).should.be.fulfilled;

      // mocking sale closeed
      await this.crowdsale.mockSetClosingTime(moment().subtract(10, 's').unix());

      await this.crowdsale.withdrawTokens({ from: beneficiary }).should.be.fulfilled;
      const tokenBalance = await this.token.balanceOf(beneficiary);
      tokenBalance.should.be.bignumber.equal(expectedTokenBalance);
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
      await this.token.owner().should.eventually.be.equal(this.crowdsale.address);

      await this.crowdsale.reclaimContract(this.token.address);
      await this.token.claimOwnership({ from: owner });
      await this.token.owner().should.eventually.be.equal(owner);
    });

    it(`doesn't immediately transfer its ownership to newOwner`, async function () {
      await this.crowdsale.transferOwnership(newOwner).should.be.fulfilled;
      await this.crowdsale.owner().should.eventually.be.equal(owner);
      await this.crowdsale.pendingOwner().should.eventually.be.equal(newOwner);
    });

    it(`transfers its ownership when new owner claims ownership`, async function () {
      await this.crowdsale.transferOwnership(newOwner).should.be.fulfilled;
      await this.crowdsale.claimOwnership({ from: newOwner });
      await this.crowdsale.owner().should.eventually.be.equal(newOwner);
    });

    context(`when it has other claimable contract's pending ownership`, async function () {
      beforeEach(async function () {
        this.otherContract = await RayonToken.new(tokenCap);
        await this.otherContract.transferOwnership(this.crowdsale.address);
      });

      it(`claims other contract ownership`, async function () {
        await this.otherContract.pendingOwner()
          .should.eventually.be.equal(this.crowdsale.address, 'pending owner before claim');
        await this.crowdsale.claimContractOwnership(this.otherContract.address)
          .should.be.fulfilled;
        await this.otherContract.owner()
          .should.eventually.be.equal(this.crowdsale.address, 'owner after claim');
      });

      it(`reverts when invalid contract is claimed`, async function () {
        await this.crowdsale.claimContractOwnership(0)
          .should.be.rejectedWith(/revert/);
        await this.crowdsale.claimContractOwnership(this.crowdsale.address)
          .should.be.rejectedWith(/revert/);
      });
    })
  });
});
