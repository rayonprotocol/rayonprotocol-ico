const moment = require('moment-timezone');
const RayonTokenCrowdsale = artifacts.require('RayonTokenCrowdsale.sol');
const RayonToken = artifacts.require('RayonToken.sol');
const BigNumber = web3.BigNumber;
const epochTimestamp = (m) => m.tz('Asia/Seoul').unix() // KST
const tokenToWei = n => (new BigNumber(10)).pow(18).times(n);

module.exports = function (deployer, network, accounts) {
  return deployer
    .then(() => {
      const tokenCap = tokenToWei(5000);
      return deployer.deploy(RayonToken, tokenCap);
    })
    .then(() => {
      // these arguments are only used for development thus do not reflect whitepaper
      const openingTime = moment().add(30, 'minutes').unix();
      const closingTime = epochTimestamp(moment('2018-12-01'));
      const rate = 500;
      const [wallet] = accounts;
      const token = RayonToken.address;
      const mimimumLimit = new BigNumber(web3.toWei('2', 'ether'));
      const maximumLimit = new BigNumber(web3.toWei('500', 'ether'));
      const crowdsaleCap = new BigNumber(web3.toWei('100000', 'ether'));

      return deployer.deploy(RayonTokenCrowdsale,
        rate, wallet, token, mimimumLimit, maximumLimit, crowdsaleCap, openingTime, closingTime
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
