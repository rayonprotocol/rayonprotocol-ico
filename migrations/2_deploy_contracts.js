const RayonTokenCrowdsale = artifacts.require('RayonTokenCrowdsale.sol');
const RayonToken = artifacts.require('RayonToken.sol');
const BigNumber = web3.BigNumber;

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(RayonToken);

  // these arguments are only used for development thus do not reflect whitepaper
  const openingTime = Math.round(new Date(Date.now() + 200000).getTime() / 1000);
  const closingTime = Math.round((new Date().getTime() + 86400000 * 20) / 1000); // Today + 20 days
  const rate = 500;
  const [wallet] = accounts;
  const token = RayonToken.address;
  const cap = new BigNumber(web3.toWei('3000', 'ether'));

  await deployer.deploy(RayonTokenCrowdsale,
    rate, wallet, token, cap, openingTime, closingTime
  );
};
