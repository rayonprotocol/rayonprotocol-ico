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
  const [owner, tokenHolder, tokenHolder2] = accounts;
  const initialBalance = new BigNumber(10).pow(18);
  const transferValue = initialBalance.dividedBy(4);

  let token;

  beforeEach(async function () {
    token = await IndividuallyPausableToken.new({ from: owner });
  });

  describe('1. INDIVIDUAL PAUSE', async function () {
    context('1.1 when the sender is the token holder', async function () {
      it('can pause an address individually', async function () {
        await token.pausedAddresses(tokenHolder).should.eventually.be.false;
        await token.pauseAddress(tokenHolder, { from: owner }).should.be.fulfilled;
        token.pausedAddresses(tokenHolder).should.eventually.be.true;
        token.pausedAddresses(tokenHolder2).should.eventually.be.false;
      });

      it('can not pause an address that already has been paused', async function () {
        await token.pauseAddress(tokenHolder, { from: owner }).should.be.fulfilled;
        await token.pauseAddress(tokenHolder, { from: owner }).should.be.rejectedWith(/revert/);
      });

      it('emits PauseAddress event', async function () {
        const [event] = await eventsIn(token.pauseAddress(tokenHolder, { from: owner }));
        event.should.be.equal('LogPauseAddress');
      });
    });

    context('1.2 when the sender is not the token owner', async function () {
      it('can not pause by non-owner', async function () {
        await token.pauseAddress(tokenHolder, { from: tokenHolder }).should.be.rejectedWith(/revert/);
        await token.pauseAddress(tokenHolder2, { from: tokenHolder }).should.be.rejectedWith(/revert/);
        await token.pauseAddress(tokenHolder, { from: owner }).should.be.fulfilled;
      });
    });
  });


  describe('2. INDIVIDUAL UNPAUSE', async function () {
    beforeEach(async function () {
      await token.pauseAddress(tokenHolder, { from: owner });
    });

    context('2.1 when the sender is the token owner', async function () {
      it('unpause an address', async function () {
        await token.unpauseAddress(tokenHolder, { from: owner }).should.be.fulfilled;;
        token.pausedAddresses(tokenHolder).should.eventually.be.false;
      });

      it('can not unpause an address that already has been unpaused', async function () {
        await token.unpauseAddress(tokenHolder, { from: owner }).should.be.fulfilled;
        await token.unpauseAddress(tokenHolder, { from: owner }).should.be.rejectedWith(/revert/);
      });

      it('can pause again when an address that already has been unpaused', async function () {
        await token.unpauseAddress(tokenHolder, { from: owner }).should.be.fulfilled;
        await token.pauseAddress(tokenHolder, { from: owner }).should.be.fulfilled;
        await token.unpauseAddress(tokenHolder, { from: owner }).should.be.fulfilled;
      });

      it('emits UnpauseAddress event', async function () {
        const [event] = await eventsIn(token.unpauseAddress(tokenHolder, { from: owner }))
        event.should.be.equal('LogUnpauseAddress');
      });

    });

    context('2.2 when the sender is not the token owner', async function () {
      it('can not unpause by non-owner', async function () {
        await token.unpauseAddress(tokenHolder, { from: tokenHolder }).should.be.rejectedWith(/revert/);
        await token.unpauseAddress(tokenHolder, { from: tokenHolder2 }).should.be.rejectedWith(/revert/);
        await token.unpauseAddress(tokenHolder, { from: owner }).should.be.fulfilled;;
      });
    });
  });

  describe('3. TRANSFER', function () {
    const sender = tokenHolder;
    const recipient = tokenHolder2;

    beforeEach(async function () {
      await token.mockAddBalance(sender, initialBalance, { from: owner });
      await token.mockAddBalance(recipient, initialBalance, { from: owner });
    });

    it('can transfer when an adderss is unpaused', async function () {
      await token.transfer(recipient, transferValue, { from: sender });

      const senderBalance = await token.balanceOf(sender);
      senderBalance.should.be.bignumber.equal(initialBalance.minus(transferValue));

      const recipientBalance = await token.balanceOf(recipient);
      recipientBalance.should.be.bignumber.equal(initialBalance.plus(transferValue));
    });

    it('can not transfer when an adderss is paused', async function () {
      await token.pauseAddress(sender).should.be.fulfilled;
      await token.transfer(recipient, transferValue, { from: sender }).should.be.rejectedWith(/revert/);
    });

    it('can recieve when an adderss gets unpaused again', async function () {
      await token.pauseAddress(recipient).should.be.fulfilled;
      await token.unpauseAddress(recipient).should.be.fulfilled;
      await token.transfer(recipient, transferValue, { from: sender });

      const senderBalance = await token.balanceOf(sender);
      senderBalance.should.be.bignumber.equal(initialBalance.minus(transferValue));

      const recipientBalance = await token.balanceOf(recipient);
      recipientBalance.should.be.bignumber.equal(initialBalance.plus(transferValue));
    });

    it('cannot receive an adderss is paused', async function () {
      await token.pauseAddress(recipient).should.be.fulfilled;
      await token.transfer(recipient, transferValue, { from: sender }).should.be.rejectedWith(/revert/);
    });
  });

  describe('4. APPROVE', function () {
    const approver = tokenHolder;
    const spender = tokenHolder2;
    const allowance = transferValue;

    beforeEach(async function () {
      await token.mockAddBalance(approver, initialBalance, { from: owner });
    });

    it('can approve when spender and approver are not unpaused', async function () {
      await token.approve(spender, allowance, { from: approver });
      const spenderAllowance = await token.allowance(approver, spender);
      spenderAllowance.should.be.bignumber.equal(allowance);
    });

    it('cannot approve when both approver and spender are paused', async function () {
      await token.pauseAddress(approver).should.be.fulfilled;
      await token.pauseAddress(spender).should.be.fulfilled;
      await token.approve(spender, allowance, { from: approver }).should.be.rejectedWith(/revert/);
    });

    it('cannot get approve when spender is paused', async function () {
      await token.pauseAddress(spender).should.be.fulfilled;
      await token.approve(spender, allowance, { from: approver }).should.be.rejectedWith(/revert/);
    });
  });

  describe('5. TRANSFERFROM', function () {
    const recipient = owner;
    const approver = tokenHolder;
    const spender = tokenHolder2;
    const allowance = transferValue;

    beforeEach(async function () {
      await token.mockAddBalance(recipient, initialBalance, { from: owner });
      await token.mockAddBalance(approver, initialBalance, { from: owner });
      await token.approve(spender, allowance, { from: approver });
    });

    it('can transfer from when all addersses are unpaused', async function () {
      await token.transferFrom(approver, recipient, allowance, { from: spender }).should.be.fulfilled;
      const approverBalance = await token.balanceOf(approver);
      approverBalance.should.be.bignumber.equal(initialBalance.minus(allowance));

      const recipientBalance = await token.balanceOf(recipient);
      recipientBalance.should.be.bignumber.equal(initialBalance.plus(allowance));
    });

    it('cannot transfer from when approver is paused', async function () {
      await token.pauseAddress(approver).should.be.fulfilled;
      await token.transferFrom(approver, recipient, allowance, { from: spender }).should.be.rejectedWith(/revert/);
    });

    it('cannot transfer from when spender is paused', async function () {
      await token.pauseAddress(spender).should.be.fulfilled;
      await token.transferFrom(approver, recipient, allowance, { from: spender }).should.be.rejectedWith(/revert/);
    });

    it('cannot transfer from when recipient is paused', async function () {
      await token.pauseAddress(recipient).should.be.fulfilled;
      await token.transferFrom(approver, recipient, allowance, { from: spender }).should.be.rejectedWith(/revert/);
    });
  });

  describe('6. DECREASE APPRVAL', function () {
    const approver = tokenHolder;
    const spender = tokenHolder2;
    const allowance = transferValue;
    const decreaseAmount = allowance.dividedBy(4);

    beforeEach(async function () {
      await token.mockAddBalance(approver, initialBalance, { from: owner });
      await token.mockAddBalance(spender, initialBalance, { from: owner });
      await token.approve(spender, allowance, { from: approver });
    });

    it('can decrease apporval when all addersses are unpaused', async function () {
      await token.decreaseApproval(spender, decreaseAmount, { from: approver });
      const spenderAllowance = await token.allowance(approver, spender);
      spenderAllowance.should.be.bignumber.equal(allowance.minus(decreaseAmount));
    });

    it('cannot decrease approval when both approver and spender are paused', async function () {
      await token.pauseAddress(approver).should.be.fulfilled;
      await token.pauseAddress(spender).should.be.fulfilled;
      await token.decreaseApproval(spender, decreaseAmount, { from: approver }).should.be.rejectedWith(/revert/);
    });

    it('cannot decrease approval when spender adderss is paused', async function () {
      await token.pauseAddress(spender).should.be.fulfilled;
      await token.decreaseApproval(spender, decreaseAmount, { from: approver }).should.be.rejectedWith(/revert/);
    });
  });

  describe('7. INCREASE APPROVAL', function () {
    const approver = tokenHolder;
    const spender = tokenHolder2;
    const allowance = transferValue;
    const increaseAmount = allowance.dividedBy(4);

    beforeEach(async function () {
      await token.mockAddBalance(approver, initialBalance, { from: owner });
      await token.mockAddBalance(spender, initialBalance, { from: owner });
      await token.approve(spender, allowance, { from: approver });
    });

    it('can increase apporval when all addersses are unpaused', async function () {
      await token.increaseApproval(spender, increaseAmount, { from: approver });
      const spenderAllowance = await token.allowance(approver, spender);
      spenderAllowance.should.be.bignumber.equal(allowance.plus(increaseAmount));
    });

    it('cannot increase approval when both approver and spender are paused', async function () {
      await token.pauseAddress(approver).should.be.fulfilled;
      await token.pauseAddress(spender).should.be.fulfilled;
      await token.increaseApproval(spender, increaseAmount, { from: approver }).should.be.rejectedWith(/revert/);
    });

    it('cannot increase approval when spender adderss is paused', async function () {
      await token.pauseAddress(spender).should.be.fulfilled;
      await token.increaseApproval(spender, increaseAmount, { from: approver }).should.be.rejectedWith(/revert/);
    });
  });
});
