const TransferLimitedToken = artifacts.require('TransferLimitedTokenMock');
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('TransferLimitedToken', function (accounts) {
  const [owner, nonOwner, limitedWalletAddress] = accounts;
  const initialBalance = new BigNumber(10).pow(18);
  const transferValue = initialBalance.dividedBy(4);

  beforeEach(async function () {
    this.token = await TransferLimitedToken.new({ from: owner });
  });

  describe('addLimitedWalletAddress', async function () {
    context('when the sender is the token owner', async function () {
      it('adds an address to limit transfer', async function () {
        await this.token.addLimitedWalletAddress(limitedWalletAddress, { from: owner });
        this.token.isLimitedWalletAddress(limitedWalletAddress).should.eventually.be.true;
      });
    });

    context('when the sender is not the token owner', async function () {
      it('reverts', async function () {
        await this.token.addLimitedWalletAddress(limitedWalletAddress, { from: nonOwner })
          .should.be.rejectedWith(/revert/);
      });
    });
  });

  describe('delLimitedWalletAddress', async function () {
    beforeEach(async function () {
      await this.token.addLimitedWalletAddress(limitedWalletAddress, { from: owner });
    });

    context('when the sender is the token owner', async function () {
      it('delete an address', async function () {
        await this.token.delLimitedWalletAddress(limitedWalletAddress, { from: owner });
        this.token.isLimitedWalletAddress(limitedWalletAddress).should.eventually.be.false;
      });
    });

    context('when the sender is not the token owner', async function () {
      it('reverts', async function () {
        await this.token.delLimitedWalletAddress(limitedWalletAddress, { from: nonOwner })
          .should.be.rejectedWith(/revert/);
      });
    });
  });

  describe('enableLimit', async function () {
    context('when the sender is the token owner', async function () {
      it('enable transfer limit ', async function () {
        await this.token.enableLimit({ from: owner });
        this.token.isLimitEnabled().should.eventually.be.true;
      });
    });

    context('when the sender is not the token owner', async function () {
      it('reverts', async function () {
        await this.token.enableLimit({ from: nonOwner }).should.be.rejectedWith(/revert/);
      });
    });
  });

  describe('disableLimit', async function () {
    beforeEach(async function () {
      await this.token.enableLimit({ from: owner });
    });

    context('when the sender is the token owner', async function () {
      it('disable transfer limit', async function () {
        await this.token.disableLimit({ from: owner });
        this.token.isLimitEnabled().should.eventually.be.false;
      });
    });

    context('when the sender is not the token owner', async function () {
      it('reverts', async function () {
        await this.token.disableLimit({ from: nonOwner }).should.be.rejectedWith(/revert/);
      });
    });
  });

  describe('transfer', async function () {
    beforeEach(async function () {
      this.token.mockSetBalance(owner, initialBalance, { from: owner });
      this.token.mockSetBalance(nonOwner, initialBalance, { from: owner });
      this.token.mockSetBalance(limitedWalletAddress, initialBalance, { from: owner });
    });

    context('when token is not paused', async function () {
      context('when limit is disabled', async function () {
        context('when an address is not limited', async function () {
          it('transfers tokens', async function () {
            await this.token.transfer(nonOwner, transferValue, { from: owner });
            const balanceAfterSent = await this.token.balanceOf(owner);
            balanceAfterSent.should.be.bignumber.equal(initialBalance.minus(transferValue));

            await this.token.transfer(owner, transferValue, { from: nonOwner });
            const balanceAfterRecieved = await this.token.balanceOf(owner);
            balanceAfterRecieved.should.be.bignumber.equal(balanceAfterSent.plus(transferValue));
          });
        });
      });

      context('when limit is enabled', async function () {
        beforeEach(async function () {
          await this.token.enableLimit({ from: owner });
        });

        context('when an address is limited', async function () {
          beforeEach(async function () {
            await this.token.addLimitedWalletAddress(limitedWalletAddress, { from: owner });
          });

          it('transfers tokens between non-limited accounts', async function () {
            await this.token.transfer(nonOwner, transferValue, { from: owner });
            const balanceAfterSent = await this.token.balanceOf(owner);
            balanceAfterSent.should.be.bignumber.equal(initialBalance.minus(transferValue));

            await this.token.transfer(owner, transferValue, { from: nonOwner });
            const balanceAfterRecieved = await this.token.balanceOf(owner);
            balanceAfterRecieved.should.be.bignumber.equal(balanceAfterSent.plus(transferValue));
          });

          it('reverts', async function () {
            await this.token.transfer(limitedWalletAddress, transferValue, { from: owner })
              .should.be.rejectedWith(/revert/);
            await this.token.transfer(owner, transferValue, { from: limitedWalletAddress })
              .should.be.rejectedWith(/revert/);
          });
        });
      });
    });

    context('when token is paused', async function () {
      beforeEach(async function () {
        await this.token.pause({ from: owner });
      });

      it('reverts', async function () {
        await this.token.transfer(nonOwner, transferValue, { from: owner }).should.be.rejectedWith(/revert/);
        await this.token.transfer(owner, transferValue, { from: nonOwner }).should.be.rejectedWith(/revert/);
      });
    });
  });
});
