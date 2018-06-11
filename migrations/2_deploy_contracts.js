const RayonCoinCrowdsale = artifacts.require('./RayonCoinCrowdsale.sol');
const RayonCoin = artifacts.require('./RayonCoin.sol');

module.exports = function(deployer, network, accounts) {
  return deployer
    .then(() => {
      return deployer.deploy(RayonCoin);
    })
    .then(() => {
      const startTime = Math.round(new Date(Date.now() + 60).getTime() / 1000);
      const endTime = Math.round((new Date().getTime() + 86400000 * 20) / 1000); // Today + 20 days
      const rate = 5;
      // const wallet = accounts[0];
      const wallet = '0xef1121ac4cd5825436A666b6983B4f0d4984e7E0';
      return deployer.deploy(RayonCoinCrowdsale, startTime, endTime, rate, wallet, RayonCoin.address);
    });
};
