const IndividuallyPausableToken = artifacts.require('IndividuallyPausableTokenMock');
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

const eventsIn = async tx => {
  const { logs } = await tx;
  return logs.map(log => log.event);
};

contract('IndividuallyPausableToken', function (accounts) {
  const [owner, nonOwner, anotherNonOwner] = accounts;
  const initialBalance = new BigNumber(10).pow(18);
  const transferValue = initialBalance.dividedBy(4);

  beforeEach(async function () {
    this.token = await IndividuallyPausableToken.new({ from: owner });
  });

  describe('individual pause', async function () {
    context('when the sender is the token owner', async function () {
      it('pause an address', async function () {
        await this.token.pauseAddress(anotherNonOwner, { from: owner }).should.be.fulfilled;
        this.token.isPausedAddress(anotherNonOwner).should.eventually.be.true;
      });

      it('can not pause an address that already has been paused', async function () {
        await this.token.pauseAddress(anotherNonOwner, { from: owner }).should.be.fulfilled;
        await this.token.pauseAddress(anotherNonOwner, { from: owner }).should.be.rejectedWith(/revert/);
      });

      it('emits PauseAddress event', async function () {
        const [event] = await eventsIn(this.token.pauseAddress(anotherNonOwner, { from: owner }));
        event.should.be.equal('PauseAddress');
      });
    });

    context('when the sender is not the token owner', async function () {
      it('reverts', async function () {
        await this.token.pauseAddress(anotherNonOwner, { from: nonOwner })
          .should.be.rejectedWith(/revert/);
      });
    });
  });


  describe('individual unpause', async function () {
    beforeEach(async function () {
      await this.token.pauseAddress(anotherNonOwner, { from: owner });
    });

    context('when the sender is the token owner', async function () {
      it('unpause an address', async function () {
        await this.token.unpauseAddress(anotherNonOwner, { from: owner }).should.be.fulfilled;;
        this.token.isPausedAddress(anotherNonOwner).should.eventually.be.false;
      });

      it('can not unpause an address that already has been unpaused', async function () {
        await this.token.unpauseAddress(anotherNonOwner, { from: owner }).should.be.fulfilled;
        await this.token.unpauseAddress(anotherNonOwner, { from: owner }).should.be.rejectedWith(/revert/);
      });

      it('emits UnpauseAddress event', async function () {
        const [event] = await eventsIn(this.token.unpauseAddress(anotherNonOwner, { from: owner }))
        event.should.be.equal('UnpauseAddress');
      });

    });

    context('when the sender is not the token owner', async function () {
      it('reverts', async function () {
        await this.token.unpauseAddress(anotherNonOwner, { from: nonOwner })
          .should.be.rejectedWith(/revert/);
      });
    });
  });

  describe('enabling individual pause', async function () {
    context('when the sender is the token owner', async function () {
      it('individual pause', async function () {
        await this.token.enableIndividualPause({ from: owner }).should.be.fulfilled;
        this.token.individualPauseEnabled().should.eventually.be.true;
      });

      it('emits EnableIndividualPause event', async function () {
        const [event] = await eventsIn(this.token.enableIndividualPause({ from: owner }));
        event.should.be.equal('EnableIndividualPause');
      });
    });

    context('when the sender is not the token owner', async function () {
      it('reverts', async function () {
        await this.token.enableIndividualPause({ from: nonOwner }).should.be.rejectedWith(/revert/);
      });
    });
  });

  describe('disabling individual pause', async function () {
    beforeEach(async function () {
      await this.token.enableIndividualPause({ from: owner });
    });

    context('when the sender is the token owner', async function () {
      it('disables individual pause', async function () {
        await this.token.disableIndividualPause({ from: owner }).should.be.fulfilled;
        this.token.individualPauseEnabled().should.eventually.be.false;
      });

      it('emits DisableIndividualPause event', async function () {
        const [event] = await eventsIn(this.token.disableIndividualPause({ from: owner }));
        event.should.be.equal('DisableIndividualPause');
      });
    });

    context('when the sender is not the token owner', async function () {
      it('reverts', async function () {
        await this.token.disableIndividualPause({ from: nonOwner }).should.be.rejectedWith(/revert/);
      });
    });
  });


  describe('individually pausable token', async function () {
    describe('pausedAddresses', function () {
      it('is not paused by default', async function () {
        this.token.pausedAddresses(anotherNonOwner).should.eventually.be.false;
      });

      it('is individually paused after being individually paused', async function () {
        await this.token.pauseAddress(anotherNonOwner).should.be.fulfilled;
        this.token.pausedAddresses(anotherNonOwner).should.eventually.be.true;
      });

      it('is not individually paused after being individually paused and then unpaused', async function () {
        await this.token.pauseAddress(anotherNonOwner).should.be.fulfilled;
        await this.token.unpauseAddress(anotherNonOwner).should.be.fulfilled;
        await this.token.pausedAddresses(anotherNonOwner).should.eventually.be.false;
      });
    });

    describe('transfer', function () {
      const sender = nonOwner;
      const recipient = anotherNonOwner;

      beforeEach(async function () {
        await this.token.mockAddBalance(sender, initialBalance, { from: owner });
        await this.token.mockAddBalance(recipient, initialBalance, { from: owner });
      });

      context('when token is individual pause enabled', async function () {
        beforeEach(async function () {
          await this.token.enableIndividualPause({ from: owner });
        });

        it('allows to transfer when an adderss is unpaused', async function () {
          await this.token.transfer(recipient, transferValue, { from: sender });

          const senderBalance = await this.token.balanceOf(sender);
          senderBalance.should.be.bignumber.equal(initialBalance.minus(transferValue));

          const recipientBalance = await this.token.balanceOf(recipient);
          recipientBalance.should.be.bignumber.equal(initialBalance.plus(transferValue));
        });

        it('reverts when trying to transfer and an adderss is paused', async function () {
          await this.token.pauseAddress(sender).should.be.fulfilled;
          await this.token.transfer(recipient, transferValue, { from: sender }).should.be.rejectedWith(/revert/);
        });

        it('allows to recieve when an adderss is unpaused', async function () {
          await this.token.pauseAddress(recipient).should.be.fulfilled;
          await this.token.unpauseAddress(recipient).should.be.fulfilled;
          await this.token.transfer(recipient, transferValue, { from: sender });

          const senderBalance = await this.token.balanceOf(sender);
          senderBalance.should.be.bignumber.equal(initialBalance.minus(transferValue));

          const recipientBalance = await this.token.balanceOf(recipient);
          recipientBalance.should.be.bignumber.equal(initialBalance.plus(transferValue));
        });

        it('reverts when trying to recieve and an adderss is paused', async function () {
          await this.token.pauseAddress(recipient).should.be.fulfilled;
          await this.token.transfer(recipient, transferValue, { from: sender }).should.be.rejectedWith(/revert/);;
        });
      });

      context('when token is individual pause disabled', async function () {
        beforeEach(async function () {
          await this.token.enableIndividualPause({ from: owner });
          await this.token.disableIndividualPause({ from: owner });
        });

        it('allows to transfer when an adderss is unpaused', async function () {
          await this.token.transfer(recipient, transferValue, { from: sender });

          const senderBalance = await this.token.balanceOf(sender);
          senderBalance.should.be.bignumber.equal(initialBalance.minus(transferValue));

          const recipientBalance = await this.token.balanceOf(recipient);
          recipientBalance.should.be.bignumber.equal(initialBalance.plus(transferValue));
        });

        it('allows to transfer when both sender and recipient are paused', async function () {
          await this.token.pauseAddress(sender).should.be.fulfilled;
          await this.token.pauseAddress(recipient).should.be.fulfilled;
          await this.token.transfer(recipient, transferValue, { from: sender });

          const senderBalance = await this.token.balanceOf(sender);
          senderBalance.should.be.bignumber.equal(initialBalance.minus(transferValue));

          const recipientBalance = await this.token.balanceOf(recipient);
          recipientBalance.should.be.bignumber.equal(initialBalance.plus(transferValue));
        });
      });
    });

    describe('approve', function () {
      const approver = nonOwner;
      const spender = anotherNonOwner;
      const allowance = transferValue;

      beforeEach(async function () {
        await this.token.mockAddBalance(approver, initialBalance, { from: owner });
        await this.token.mockAddBalance(spender, initialBalance, { from: owner });
      });

      context('when token is individual pause enabled', async function () {
        beforeEach(async function () {
          await this.token.enableIndividualPause({ from: owner });
        });

        it('allows to approve when an adderss is unpaused', async function () {
          await this.token.approve(spender, allowance, { from: approver });
          const spenderAllowance = await this.token.allowance(approver, spender);
          spenderAllowance.should.be.bignumber.equal(allowance);
        });

        it('reverts when trying to approve both approver and spender are paused', async function () {
          await this.token.pauseAddress(approver).should.be.fulfilled;
          await this.token.pauseAddress(spender).should.be.fulfilled;
          await this.token.approve(spender, allowance, { from: approver }).should.be.rejectedWith(/revert/);
        });

        it('reverts when trying to get approved and an adderss is paused', async function () {
          await this.token.pauseAddress(spender).should.be.fulfilled;
          await this.token.approve(spender, allowance, { from: approver }).should.be.rejectedWith(/revert/);
        });
      });

      context('when token is individual pause disabled', async function () {
        beforeEach(async function () {
          await this.token.enableIndividualPause({ from: owner });
          await this.token.disableIndividualPause({ from: owner });
        });

        it('allows to approve when an adderss is unpaused', async function () {
          await this.token.approve(spender, allowance, { from: approver });
          const spenderAllowance = await this.token.allowance(approver, spender);
          spenderAllowance.should.be.bignumber.equal(allowance);
        });

        it('allows to approve when an both approver and spender are paused', async function () {
          await this.token.pauseAddress(approver).should.be.fulfilled;
          await this.token.pauseAddress(spender).should.be.fulfilled;
          await this.token.approve(spender, allowance, { from: approver });
          const spenderAllowance = await this.token.allowance(approver, spender);
          spenderAllowance.should.be.bignumber.equal(allowance);
        });
      });
    });

    describe('transfer from', function () {
      const recipient = owner;
      const approver = nonOwner;
      const spender = anotherNonOwner;
      const allowance = transferValue;

      beforeEach(async function () {
        await this.token.mockAddBalance(recipient, initialBalance, { from: owner });
        await this.token.mockAddBalance(approver, initialBalance, { from: owner });
        await this.token.mockAddBalance(spender, initialBalance, { from: owner });
        await this.token.approve(spender, allowance, { from: approver });
      });

      context('when token is individual pause enabled', async function () {
        beforeEach(async function () {
          await this.token.enableIndividualPause({ from: owner });
        });

        it('allows to transfer from when an adderss is unpaused', async function () {
          await this.token.transferFrom(approver, recipient, allowance, { from: spender }).should.be.fulfilled;
          const approverBalance = await this.token.balanceOf(approver);
          approverBalance.should.be.bignumber.equal(initialBalance.minus(allowance));

          const recipientBalance = await this.token.balanceOf(recipient);
          recipientBalance.should.be.bignumber.equal(initialBalance.plus(allowance));
        });

        it('reverts when trying to transfer from and approver is paused', async function () {
          await this.token.pauseAddress(approver).should.be.fulfilled;
          await this.token.transferFrom(approver, recipient, allowance, { from: spender }).should.be.rejectedWith(/revert/);
        });

        it('reverts when trying to transfer from and spender is paused', async function () {
          await this.token.pauseAddress(spender).should.be.fulfilled;
          await this.token.transferFrom(approver, recipient, allowance, { from: spender }).should.be.rejectedWith(/revert/);
        });

        it('reverts when trying to recieved from and recipient is paused', async function () {
          await this.token.pauseAddress(recipient).should.be.fulfilled;
          await this.token.transferFrom(approver, recipient, allowance, { from: spender }).should.be.rejectedWith(/revert/);
        });
      });

      context('when token is individual pause disabled', async function () {
        beforeEach(async function () {
          await this.token.enableIndividualPause({ from: owner });
          await this.token.disableIndividualPause({ from: owner });
        });

        it('allows to transfer from when an adderss is unpaused', async function () {
          await this.token.transferFrom(approver, recipient, allowance, { from: spender }).should.be.fulfilled;
          const approverBalance = await this.token.balanceOf(approver);
          approverBalance.should.be.bignumber.equal(initialBalance.minus(allowance));

          const recipientBalance = await this.token.balanceOf(recipient);
          recipientBalance.should.be.bignumber.equal(initialBalance.plus(allowance));
        });

        it('allows to transfer from when approver and spender and recipient are paused', async function () {
          await this.token.pauseAddress(approver).should.be.fulfilled;
          await this.token.pauseAddress(spender).should.be.fulfilled;
          await this.token.pauseAddress(recipient).should.be.fulfilled;
          await this.token.transferFrom(approver, recipient, allowance, { from: spender }).should.be.fulfilled;
          const approverBalance = await this.token.balanceOf(approver);
          approverBalance.should.be.bignumber.equal(initialBalance.minus(allowance));

          const recipientBalance = await this.token.balanceOf(recipient);
          recipientBalance.should.be.bignumber.equal(initialBalance.plus(allowance));
        });
      });
    });

    describe('decrease approval', function () {
      const approver = nonOwner;
      const spender = anotherNonOwner;
      const allowance = transferValue;
      const decreaseAmount = allowance.dividedBy(4);

      beforeEach(async function () {
        await this.token.mockAddBalance(approver, initialBalance, { from: owner });
        await this.token.mockAddBalance(spender, initialBalance, { from: owner });
        await this.token.approve(spender, allowance, { from: approver });
      });

      context('when token is individual pause enabled', async function () {
        beforeEach(async function () {
          await this.token.enableIndividualPause({ from: owner });
        });

        it('allows to decrease apporval when an adderss is unpaused', async function () {
          await this.token.decreaseApproval(spender, decreaseAmount, { from: approver });
          const spenderAllowance = await this.token.allowance(approver, spender);
          spenderAllowance.should.be.bignumber.equal(allowance.minus(decreaseAmount));
        });

        it('reverts when trying to decrease apporval both approver and spender are paused', async function () {
          await this.token.pauseAddress(approver).should.be.fulfilled;
          await this.token.pauseAddress(spender).should.be.fulfilled;
          await this.token.decreaseApproval(spender, decreaseAmount, { from: approver }).should.be.rejectedWith(/revert/);
        });

        it('reverts when trying to get approved and an adderss is paused', async function () {
          await this.token.pauseAddress(spender).should.be.fulfilled;
          await this.token.decreaseApproval(spender, decreaseAmount, { from: approver }).should.be.rejectedWith(/revert/);
        });
      });

      context('when token is individual pause disabled', async function () {
        beforeEach(async function () {
          await this.token.enableIndividualPause({ from: owner });
          await this.token.disableIndividualPause({ from: owner });
        });

        it('allows to decrease when an adderss is unpaused', async function () {
          await this.token.decreaseApproval(spender, decreaseAmount, { from: approver });
          const spenderAllowance = await this.token.allowance(approver, spender);
          spenderAllowance.should.be.bignumber.equal(allowance.minus(decreaseAmount));
        });

        it('allows to decrease when an both approver and spender are paused', async function () {
          await this.token.pauseAddress(approver).should.be.fulfilled;
          await this.token.pauseAddress(spender).should.be.fulfilled;
          await this.token.decreaseApproval(spender, decreaseAmount, { from: approver });
          const spenderAllowance = await this.token.allowance(approver, spender);
          spenderAllowance.should.be.bignumber.equal(allowance.minus(decreaseAmount));
        });
      });
    });

    describe('increase approval', function () {
      const approver = nonOwner;
      const spender = anotherNonOwner;
      const allowance = transferValue;
      const increaseAmount = allowance.dividedBy(4);

      beforeEach(async function () {
        await this.token.mockAddBalance(approver, initialBalance, { from: owner });
        await this.token.mockAddBalance(spender, initialBalance, { from: owner });
        await this.token.approve(spender, allowance, { from: approver });
      });

      context('when token is individual pause enabled', async function () {
        beforeEach(async function () {
          await this.token.enableIndividualPause({ from: owner });
        });

        it('allows to increase apporval when an adderss is unpaused', async function () {
          await this.token.increaseApproval(spender, increaseAmount, { from: approver });
          const spenderAllowance = await this.token.allowance(approver, spender);
          spenderAllowance.should.be.bignumber.equal(allowance.plus(increaseAmount));
        });

        it('reverts when trying to increase apporval both approver and spender are paused', async function () {
          await this.token.pauseAddress(approver).should.be.fulfilled;
          await this.token.pauseAddress(spender).should.be.fulfilled;
          await this.token.increaseApproval(spender, increaseAmount, { from: approver }).should.be.rejectedWith(/revert/);
        });

        it('reverts when trying to get approved and an adderss is paused', async function () {
          await this.token.pauseAddress(spender).should.be.fulfilled;
          await this.token.increaseApproval(spender, increaseAmount, { from: approver }).should.be.rejectedWith(/revert/);
        });
      });

      context('when token is individual pause disabled', async function () {
        beforeEach(async function () {
          await this.token.enableIndividualPause({ from: owner });
          await this.token.disableIndividualPause({ from: owner });
        });

        it('allows to increase when an adderss is unpaused', async function () {
          await this.token.increaseApproval(spender, increaseAmount, { from: approver });
          const spenderAllowance = await this.token.allowance(approver, spender);
          spenderAllowance.should.be.bignumber.equal(allowance.plus(increaseAmount));
        });

        it('allows to increase when an both approver and spender are paused', async function () {
          await this.token.pauseAddress(approver).should.be.fulfilled;
          await this.token.pauseAddress(spender).should.be.fulfilled;
          await this.token.increaseApproval(spender, increaseAmount, { from: approver });
          const spenderAllowance = await this.token.allowance(approver, spender);
          spenderAllowance.should.be.bignumber.equal(allowance.plus(increaseAmount));
        });
      });
    });
  })
});
