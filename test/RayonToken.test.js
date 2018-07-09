const bigNumber = require('bignumber.js');
const RayonToken = artifacts.require('RayonToken');
const assertRevert = require('./helpers/assertRevert');

contract('RayonToken', async (accounts) => {
  const [_owner, _transferLimitedAccount] = accounts;
  const _initialValue = new bigNumber(1e+18);
  const _transferValue = _initialValue.dividedBy(4);
  let rayonToken;

  getBalanceOf = (account) => rayonToken.balanceOf(account);

  beforeEach(async () => {
    rayonToken = await RayonToken.new();
    await rayonToken.mint(_owner, _initialValue);
    await rayonToken.mint(_transferLimitedAccount, _initialValue);
  });

  it(`gets account balance`, async () => {
    const balance = await getBalanceOf(_transferLimitedAccount);
    assert.equal(balance.toString(), _initialValue.toString(), `should match balance`);
  })

  it(`transfers tokens`, async () => {
    await rayonToken.transfer(_owner, _transferValue, { from: _transferLimitedAccount })
    const balanceAfterSent = await getBalanceOf(_transferLimitedAccount);
    assert.equal(balanceAfterSent.toString(), _initialValue.minus(_transferValue).toString());
  });

  context('limiting transfers within a specific account', async () => {
    beforeEach(async () => {
      await rayonToken.enableLimit();
      await rayonToken.addLimitedWalletAddress(_transferLimitedAccount);
    });

    it(`limits to transfer tokens`, async () => {
      assertRevert(
        rayonToken.transfer(_owner, _transferValue, { from: _transferLimitedAccount })
      );
      assertRevert(
        rayonToken.transfer(_transferLimitedAccount, _transferValue)
      );
    });

    context('removing transfer limitation', async () => {
      beforeEach(async () => {
        await rayonToken.delLimitedWalletAddress(_transferLimitedAccount);
      });
  
      it(`transfers tokens`, async () => {
        await rayonToken.transfer(_owner, _transferValue, { from: _transferLimitedAccount })
        const balanceAfterSent = await getBalanceOf(_transferLimitedAccount);
        assert.equal(balanceAfterSent.toString(), _initialValue.minus(_transferValue).toString());

        await rayonToken.transfer(_transferLimitedAccount, _transferValue)
        const balanceRecieved = await getBalanceOf(_transferLimitedAccount);
        assert.equal(balanceRecieved.toString(), balanceAfterSent.plus(_transferValue).toString());
      });
    });
  });


  context('halting transfers', async () => {
    beforeEach(async () => {
      await rayonToken.halt();
    });

    it(`limits all transfers`, async () => {
      assertRevert(
        rayonToken.transfer(_owner, _transferValue, { from: _transferLimitedAccount })
      );
      assertRevert(
        rayonToken.transfer(_transferLimitedAccount, _transferValue)
      );
      assertRevert(
        rayonToken.transfer(_transferLimitedAccount, _transferValue)
      );
      assertRevert(
        rayonToken.transfer(_owner, _transferValue, { from: _transferLimitedAccount })
      );
    });
  })


});
