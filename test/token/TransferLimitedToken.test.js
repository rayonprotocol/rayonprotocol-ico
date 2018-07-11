const TransferLimitedToken = artifacts.require('TransferLimitedTokenMock');
const BigNumber = require('bignumber.js');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();


contract('TransferLimitedToken', function(accounts) {  
  const [owner, nonOwner, limitedWalletAddress] = accounts;
  const initialBalance = new BigNumber(1e+18);
  const transferValue = initialBalance.dividedBy(4);

  beforeEach(async () => {
    this.token = await TransferLimitedToken.new({ from: owner });
  });

  describe('addLimitedWalletAddress', async () => {

    context('when the sender is the token owner', async () => {

      it('adds an address to limit transfer', async () => {
        await this.token.addLimitedWalletAddress(limitedWalletAddress, { from: owner });
        this.token.isLimitedWalletAddress(limitedWalletAddress).should.eventually.be.true;
      });

    });

    context('when the sender is not the token owner', async () => {

      it('reverts', async () => {
        await this.token.addLimitedWalletAddress(limitedWalletAddress, { from: nonOwner }).should.be.rejectedWith(/revert/);
      });

    });

  });

  describe('delLimitedWalletAddress', async () => {

    beforeEach(async () => {
      await this.token.addLimitedWalletAddress(limitedWalletAddress, { from: owner });
    });

    context('when the sender is the token owner', async () => {
      it('delete an address', async () => {
        await this.token.delLimitedWalletAddress(limitedWalletAddress, { from: owner });
        this.token.isLimitedWalletAddress(limitedWalletAddress).should.eventually.be.false;
      });

    });

    context('when the sender is not the token owner', async () => {
      it('reverts', async () => {
        await this.token.delLimitedWalletAddress(limitedWalletAddress, { from: nonOwner }).should.be.rejectedWith(/revert/);
      });

    });

  });

  describe('enableLimit', async () => {

    context('when the sender is the token owner', async () => {
      it('enable transfer limit ', async () => {
        await this.token.enableLimit({ from: owner });
        this.token.isLimitEnabled().should.eventually.be.true;
      });

    });

    context('when the sender is not the token owner', async () => {
      it('reverts', async () => {
        await this.token.enableLimit({ from: nonOwner }).should.be.rejectedWith(/revert/);
      });

    });

  });

  describe('disableLimit', async () => {

    beforeEach(async () => {
      await this.token.enableLimit({ from: owner });
    })

    context('when the sender is the token owner', async () => {

      it('disable transfer limit', async () => {
        await this.token.disableLimit({ from: owner });
        this.token.isLimitEnabled().should.eventually.be.false;
      });

    });

    context('when the sender is not the token owner', async () => {
      it('reverts', async () => {
        await this.token.disableLimit({ from: nonOwner }).should.be.rejectedWith(/revert/);
      });

    });

  });

  describe('transfer', async () => {
    beforeEach(async () => {
      this.token.mockSetBalance(owner, initialBalance, { from: owner });
      this.token.mockSetBalance(nonOwner, initialBalance, { from: owner });
      this.token.mockSetBalance(limitedWalletAddress, initialBalance, { from: owner });
    })

    context('when token is unhalted', async () => {

      context('when limit is disabled', async () => {

        context('when an address is not limited', async () => {

          it('transfers tokens', async () => {
            await this.token.transfer(nonOwner, transferValue, { from: owner });
            const balanceAfterSent = await this.token.balanceOf(owner);
            balanceAfterSent.should.be.bignumber.equal(initialBalance.minus(transferValue));

            await this.token.transfer(owner, transferValue, { from: nonOwner });
            const balanceAfterRecieved = await this.token.balanceOf(owner);
            balanceAfterRecieved.should.be.bignumber.equal(balanceAfterSent.plus(transferValue));
          });

        });

      });

      context('when limit is enabled', async () => {

        beforeEach(async () => {
          await this.token.enableLimit({ from: owner });
        });

        context('when an address is limited', async () => {

          beforeEach(async () => {
            await this.token.addLimitedWalletAddress(limitedWalletAddress, { from: owner });
          });

          it('transfers tokens between non-limited accounts', async () => {
            await this.token.transfer(nonOwner, transferValue, { from: owner });
            const balanceAfterSent = await this.token.balanceOf(owner);
            balanceAfterSent.should.be.bignumber.equal(initialBalance.minus(transferValue));

            await this.token.transfer(owner, transferValue, { from: nonOwner });
            const balanceAfterRecieved = await this.token.balanceOf(owner);
            balanceAfterRecieved.should.be.bignumber.equal(balanceAfterSent.plus(transferValue));
          });

          it('reverts', async () => {
            await this.token.transfer(limitedWalletAddress, transferValue, { from: owner }).should.be.rejectedWith(/revert/);
            await this.token.transfer(owner, transferValue, { from: limitedWalletAddress }).should.be.rejectedWith(/revert/);
          });

        });

      });

    });

    context('when token is halted', async () => {

      beforeEach(async () => {
        await this.token.halt({ from: owner });
      });

      it('reverts', async () => {
        await this.token.transfer(nonOwner, transferValue, { from: owner }).should.be.rejectedWith(/revert/);
        await this.token.transfer(owner, transferValue, { from: nonOwner }).should.be.rejectedWith(/revert/);
      });

    });

  });

});
