const moment = require('moment-timezone');
const RayonTokenCrowdsale = artifacts.require('RayonTokenCrowdsale.sol');
const RayonToken = artifacts.require('RayonToken.sol');
const BigNumber = web3.BigNumber;
const epochTimestamp = (m) => m.tz('Asia/Seoul').unix() // KST

module.exports = function (deployer, network, accounts) {
  return deployer
    .then(() => {
      return deployer.deploy(RayonToken);
    })
    .then(() => {
      // these arguments are only used for development thus do not reflect whitepaper
      const openingTime = epochTimestamp(moment().add(5, 'minutes'))
      const closingTime = epochTimestamp(moment('2018-12-01'));
      const rate = 500;
      const [wallet] = accounts;
      const token = RayonToken.address;
      const cap = new BigNumber(web3.toWei('3000', 'ether'));

      return deployer.deploy(RayonTokenCrowdsale,
        rate, wallet, token, cap, openingTime, closingTime
      );
    })
    .then(() => {
      const rayonToken = RayonToken.at(RayonToken.address);
      return rayonToken.transferOwnership(RayonTokenCrowdsale.address);
    })
    .then(() => {
      const rayonTokenCrowdsale = RayonTokenCrowdsale.at(RayonTokenCrowdsale.address);
      return rayonTokenCrowdsale.claimContractOwnership(RayonToken.address);
    })
    .catch(error => console.error({ error }));
};
