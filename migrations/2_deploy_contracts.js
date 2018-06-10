const RayonCoinCrowdsale = artifacts.require('./RayonCoinCrowdsale.sol');
const RayonCoin = artifacts.require('./RayonCoin.sol');

module.exports = function (deployer, network, accounts) {
    const startTime = Math.round((new Date(Date.now() + 86400000).getTime()) / 1000); // Yesterday
    const endTime = Math.round((new Date().getTime() + (86400000 * 20)) / 1000); // Today + 20 days
    const rate = 5;
    // const wallet = accounts[1];
    const wallet = "0xCA19ddbca9ad926e6DEAd313F850f04449360b89";
    return deployer
        .then(() => {
            return deployer.deploy(RayonCoin);
        })
        .then(() => {
            return deployer.deploy(
                RayonCoinCrowdsale,
                startTime,
                endTime,
                rate,
                wallet,
                RayonCoin.address
            );
        });
};