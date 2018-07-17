const Pausable = artifacts.require('Pausable');
const assertRevert = require('../helpers/assertRevert');
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();


contract('Pausable', function (accounts) {
  const [owner, nonOwner] = accounts;

  beforeEach(async function() {
    this.pausable = await Pausable.new({ from: owner });
  });

  describe('pause', async function() {

    context('when the sender is the token owner', async function() {

      context('when token transfer is not paused', async function() {

        it('pauses token transfer', async function() {
          await this.pausable.pause({ from: owner });
          this.pausable.paused().should.eventually.be.true;
        });

      });

    });

    context('when the sender is not the token owner', async function() {

      context('when token transfer is not paused', async function() {

        it('reverts', async function() {
          this.pausable.paused().should.eventually.be.false;
          await assertRevert(this.pausable.pause({ from: nonOwner }));
          
        });

      });

    });

  });

  describe('unpause', async function() {

    context('when the sender is the token owner', async function() {

      context('when token transfer is paused', async function() {

        beforeEach(async function() {
          await this.pausable.pause({ from: owner });
        });

        it('unpauses token transfer', async function() {
          await this.pausable.unpause({ from: owner });
          await this.pausable.paused().should.eventually.be.false;
        });
      });

      context('when token transfer is not paused', async function() {

        it('reverts', async function() {
          await assertRevert(this.pausable.unpause({ from: owner }))
        });
      });
    });

    context('when the sender is not the token owner', async function() {

      context('when token transfer is paused', async function() {

        beforeEach(async function() {
          await this.pausable.pause({ from: owner });
        });

        it('reverts', async function() {
          await assertRevert(this.pausable.unpause({ from: nonOwner }));
        });
      });

      context('when token transfer is not paused', async function() {

        it('reverts', async function() {
          await assertRevert(this.pausable.unpause({ from: nonOwner }));
        });

      });

    });

  });

});
