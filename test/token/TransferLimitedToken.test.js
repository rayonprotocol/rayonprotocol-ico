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
      context('and limit is disabled', async function () {
        context('and an address is not limited', async function () {
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

      context('and limit is enabled', async function () {
        beforeEach(async function () {
          await this.token.enableLimit({ from: owner });
        });

        context('and an address is limited', async function () {
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

    context('and token is paused', async function () {
      beforeEach(async function () {
        await this.token.pause({ from: owner });
      });

      it('reverts', async function () {
        await this.token.transfer(nonOwner, transferValue, { from: owner }).should.be.rejectedWith(/revert/);
        await this.token.transfer(owner, transferValue, { from: nonOwner }).should.be.rejectedWith(/revert/);
      });
    });
  });

  describe('approve', async function () {
    beforeEach(async function () {
      this.token.mockSetBalance(owner, initialBalance, { from: owner });
      this.token.mockSetBalance(nonOwner, initialBalance, { from: owner });
      this.token.mockSetBalance(limitedWalletAddress, initialBalance, { from: owner });
    });

    context('when token is not paused', async function () {
      context('and limit is disabled', async function () {
        context('and an address is not limited', async function () {
          it('approves token transfer to spender', async function () {
            await this.token.approve(nonOwner, transferValue, { from: owner }).should.be.fulfilled;
          });
        });

        context('and limit is enabled', async function () {
          beforeEach(async function () {
            await this.token.enableLimit({ from: owner });
          });

          context('and an address is limited', async function () {
            beforeEach(async function () {
              await this.token.addLimitedWalletAddress(limitedWalletAddress, { from: owner });
            });

            it('approves non-limited accounts', async function () {
              await this.token.approve(nonOwner, transferValue, { from: owner }).should.be.fulfilled;
              await this.token.approve(owner, transferValue, { from: nonOwner }).should.be.fulfilled;
            });

            it('can not approve non-limited accounts', async function () {
              await this.token.approve(nonOwner, transferValue, { from: limitedWalletAddress })
                .should.be.rejectedWith(/revert/);

              await this.token.approve(limitedWalletAddress, transferValue, { from: nonOwner })
                .should.be.rejectedWith(/revert/);
            });
          });
        });
      });
    });

    context('when token is paused', async function () {
      beforeEach(async function () {
        await this.token.pause({ from: owner });
      });

      it('reverts', async function () {
        await this.token.approve(nonOwner, transferValue, { from: owner })
          .should.be.rejectedWith(/revert/);
      });
    });
  });

  describe('transferFrom', async function () {
    beforeEach(async function () {
      this.token.mockSetBalance(owner, initialBalance, { from: owner });
      this.token.mockSetBalance(nonOwner, initialBalance, { from: owner });
      this.token.mockSetBalance(limitedWalletAddress, initialBalance, { from: owner });
      await this.token.approve(nonOwner, transferValue, { from: owner });
      await this.token.approve(limitedWalletAddress, transferValue, { from: owner });
    });

    context('when token is not paused', async function () {
      context('and limit is disabled', async function () {
        context('and an address is not limited', async function () {
          it('transfers tokens from spender', async function () {
            await this.token.transferFrom(owner, nonOwner, transferValue, { from: nonOwner });

            const senderBalance = await this.token.balanceOf(owner);
            senderBalance.should.be.bignumber.equal(initialBalance.minus(transferValue));

            const recipientBalance = await this.token.balanceOf(nonOwner);
            recipientBalance.should.be.bignumber.equal(initialBalance.plus(transferValue));
          });
        });
      });

      context('and limit is enabled', async function () {
        beforeEach(async function () {
          await this.token.enableLimit({ from: owner });
        });

        context('and an address is limited', async function () {
          beforeEach(async function () {
            await this.token.addLimitedWalletAddress(limitedWalletAddress, { from: owner });
          });

          it('transfers tokens between non-limited accounts', async function () {
            await this.token.transferFrom(owner, nonOwner, transferValue, { from: nonOwner });

            const senderBalance = await this.token.balanceOf(owner);
            senderBalance.should.be.bignumber.equal(initialBalance.minus(transferValue));

            const recipientBalance = await this.token.balanceOf(nonOwner);
            recipientBalance.should.be.bignumber.equal(initialBalance.plus(transferValue));
          });

          it('can not transfer tokens between non-limited accounts', async function () {
            await this.token.transferFrom(owner, limitedWalletAddress, transferValue, { from: limitedWalletAddress })
              .should.be.rejectedWith(/revert/);

            await this.token.transferFrom(owner, limitedWalletAddress, transferValue, { from: nonOwner })
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
        await this.token.transferFrom(owner, nonOwner, transferValue, { from: nonOwner })
          .should.be.rejectedWith(/revert/);
      });
    });
  });
});
