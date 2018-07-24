const moment = require('moment-timezone');
const RayonTokenCrowdsale = artifacts.require('RayonTokenCrowdsale.sol');
const RayonToken = artifacts.require('RayonToken.sol');
const BigNumber = web3.BigNumber;
const epochTimestamp = (year, month, date, hour = 0, minute = 0) => moment()
  .tz('Asia/Seoul') // KST
  .set({ year, month: month - 1, date, hour, minute }) // refine month to be in range from 0 to 11.
  .unix();

module.exports = function (deployer, network, accounts) {
  return deployer
    .then(() => {
      return deployer.deploy(RayonToken);
    })
    .then(() => {
      // these arguments are only used for development thus do not reflect whitepaper
      const openingTime = epochTimestamp(2018, 7, moment().date(), moment().hour(), moment().minute() + 5);
      const closingTime = epochTimestamp(2018, 12, 1);
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
    .catch(error => console.error({ error }));
};
