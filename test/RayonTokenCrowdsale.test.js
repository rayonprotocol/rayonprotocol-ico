import { advanceBlock } from 'openzeppelin-solidity/test/helpers/advanceToBlock';
import { increaseTimeTo, duration } from 'openzeppelin-solidity/test/helpers/increaseTime';
import { latestTime } from 'openzeppelin-solidity/test/helpers/latestTime';

const RayonToken = artifacts.require('RayonToken');
const RayonTokenCrowdsale = artifacts.require('RayonTokenCrowdsale');
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
  const mimimumLimit = ether(2);
  const maximumLimit = ether(100);
  const crowdsaleHardCap = ether(3000);

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
    const currentTime = await latestTime();
    // Setup time
    openingTime = currentTime + duration.days(1);
    afterOpeningTime = openingTime + duration.seconds(5);
    closingTime = openingTime + duration.weeks(12);
    afterClosingTime = closingTime + duration.seconds(5);
    // Token and Crowdsale
    token = await RayonToken.new(tokenCap);
    crowdsale = await RayonTokenCrowdsale.new(
      rate, wallet, token.address, mimimumLimit, maximumLimit, crowdsaleHardCap, openingTime, closingTime
    );
    await token.transferOwnership(crowdsale.address);
    await crowdsale.claimContractOwnership(token.address);
    await crowdsale.addAddressToWhitelist(beneficiary);
  });

  describe('valid sale', function () {
    it('is not reached cap', async function () {
      await crowdsale.capReached().should.eventually.be.false;
    });

    it('is opened', async function () {
      await crowdsale.hasClosed().should.eventually.be.false;
    });

    it('verifies whiltelistee', async function () {
      await crowdsale.whitelist(beneficiary).should.eventually.be.true;
    });
  });

  describe('token purchase', function () {
    beforeEach(async function () {
      // make sale opened
      await increaseTimeTo(afterOpeningTime);
    });

    it(`doesn't immediately assign tokens to beneficiary`, async function () {
      const value = ether(5);
      const expectedLockedTokenBalance = value.mul(rate);
      await crowdsale.sendTransaction({ value, from: beneficiary }).should.be.fulfilled;

      const tokenBalance = await token.balanceOf(beneficiary);
      tokenBalance.should.be.bignumber.equal(0);
      const lockedTokenBalance = await crowdsale.balances(beneficiary)
      lockedTokenBalance.should.bignumber.be.equal(expectedLockedTokenBalance);
    });

    it('assigns tokens when beneficiary claims after sale close', async function () {
      const value = ether(5);
      const expectedTokenBalance = value.mul(rate);
      await crowdsale.sendTransaction({ value, from: beneficiary }).should.be.fulfilled;

      // make sale close
      await increaseTimeTo(afterClosingTime);

      await crowdsale.withdrawTokens({ from: beneficiary }).should.be.fulfilled;
      const tokenBalance = await token.balanceOf(beneficiary);
      tokenBalance.should.be.bignumber.equal(expectedTokenBalance);
    });

    it('forwards funds to wallet', async function () {
      const value = ether(5);
      const balanceBeforeForward = await getEthBalance(wallet);
      await crowdsale.sendTransaction({ value, from: beneficiary }).should.be.fulfilled;

      const balanceAfterForward = await getEthBalance(wallet);
      balanceAfterForward.should.be.bignumber.equal(balanceBeforeForward.plus(value));
    });
  });

  describe('ownership', function () {
    it('returns token ownership to owner', async function () {
      await token.owner().should.eventually.be.equal(crowdsale.address);

      await crowdsale.reclaimContract(token.address);
      await token.claimOwnership({ from: owner });
      await token.owner().should.eventually.be.equal(owner);
    });

    it(`doesn't immediately transfer its ownership to newOwner`, async function () {
      await crowdsale.transferOwnership(newOwner).should.be.fulfilled;
      await crowdsale.owner().should.eventually.be.equal(owner);
      await crowdsale.pendingOwner().should.eventually.be.equal(newOwner);
    });

    it(`transfers its ownership when new owner claims ownership`, async function () {
      await crowdsale.transferOwnership(newOwner).should.be.fulfilled;
      await crowdsale.claimOwnership({ from: newOwner });
      await crowdsale.owner().should.eventually.be.equal(newOwner);
    });

    context(`when it has other claimable contract's pending ownership`, async function () {
      beforeEach(async function () {
        this.otherContract = await RayonToken.new(tokenCap);
        await this.otherContract.transferOwnership(crowdsale.address);
      });

      it(`claims other contract ownership`, async function () {
        await this.otherContract.pendingOwner()
          .should.eventually.be.equal(crowdsale.address, 'pending owner before claim');
        await crowdsale.claimContractOwnership(this.otherContract.address)
          .should.be.fulfilled;
        await this.otherContract.owner()
          .should.eventually.be.equal(crowdsale.address, 'owner after claim');
      });

      it(`reverts when invalid contract is claimed`, async function () {
        await crowdsale.claimContractOwnership(0)
          .should.be.rejectedWith(/revert/);
        await crowdsale.claimContractOwnership(crowdsale.address)
          .should.be.rejectedWith(/revert/);
      });
    })
  });
});
