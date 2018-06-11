const RayonCoinCrowdsale = artifacts.require('./RayonCoinCrowdsale.sol');
const RayonCoin = artifacts.require('./RayonCoin.sol');

module.exports = function(deployer, network, accounts) {
  return deployer
    .then(() => {
      return deployer.deploy(RayonCoin);
    })
    .then(() => {
      const latest = web3.eth.getBlock('latest');
      console.log('latest', latest.timeStamp);
      const startTime = Math.round(new Date(Date.now() + 86400000).getTime() / 1000);
      const endTime = Math.round((new Date().getTime() + 86400000 * 20) / 1000); // Today + 20 days
      const rate = 5;
      // const wallet = accounts[0];
      const wallet = '0xCA19ddbca9ad926e6DEAd313F850f04449360b89';
      console.log('HD wallet accounts', accounts);
      return deployer.deploy(RayonCoinCrowdsale, startTime, endTime, rate, wallet, RayonCoin.address);
    });
};
