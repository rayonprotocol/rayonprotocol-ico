const Haltable = artifacts.require('Haltable');
const assertRevert = require('../helpers/assertRevert');
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();


contract('Haltable', function (accounts) {
  const [owner, nonOwner] = accounts;

  beforeEach(async function() {
    this.haltable = await Haltable.new({ from: owner });
  });

  describe('halt', async function() {

    context('when the sender is the token owner', async function() {

      context('when token transfer is unhalted', async function() {

        it('halts token transfer', async function() {
          await this.haltable.halt({ from: owner });
          this.haltable.halted().should.eventually.be.true;
        });

      });

    });

    context('when the sender is not the token owner', async function() {

      context('when token transfer is unhalted', async function() {

        it('reverts', async function() {
          this.haltable.halted().should.eventually.be.false;
          await assertRevert(this.haltable.halt({ from: nonOwner }));
          
        });

      });

    });

  });

  describe('unhalt', async function() {

    context('when the sender is the token owner', async function() {

      context('when token transfer is halted', async function() {

        beforeEach(async function() {
          await this.haltable.halt({ from: owner });
        });

        it('unhalts token transfer', async function() {
          await this.haltable.unhalt({ from: owner });
          await this.haltable.halted().should.eventually.be.false;
        });
      });

      context('when token transfer is unhalted', async function() {

        it('reverts', async function() {
          await assertRevert(this.haltable.unhalt({ from: owner }))
        });
      });
    });

    context('when the sender is not the token owner', async function() {

      context('when token transfer is halted', async function() {

        beforeEach(async function() {
          await this.haltable.halt({ from: owner });
        });

        it('reverts', async function() {
          await assertRevert(this.haltable.unhalt({ from: nonOwner }));
        });
      });

      context('when token transfer is unhalted', async function() {

        it('reverts', async function() {
          await assertRevert(this.haltable.unhalt({ from: nonOwner }));
        });

      });

    });

  });

});
