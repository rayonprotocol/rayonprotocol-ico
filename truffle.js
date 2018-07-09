const HDWalletProvider = require('truffle-hdwallet-provider');
const addressIndex = 0;
const numAddresses = 2;

const devMnemonic = 'rhythm vicious awful truck hint boring scale debris embark forest decline salad';
const devProvider = new HDWalletProvider(devMnemonic, 'http://localhost:7545', addressIndex, numAddresses);

const infura_apikey = 'JIA5eiNFvLhAStdxeTvb'; // Either use this key or get yours at https://infura.io/signup. It's free.
const testnetMnemonic = 'zoo you win van use two sun rib pig own now ten';
const testnetProvider = new HDWalletProvider(testnetMnemonic, `https://ropsten.infura.io/${infura_apikey}`, addressIndex, numAddresses);

module.exports = {
  networks: {
    development: {
      provider: devProvider,
      gas: 90000000000,
      gasPrice: 1,
      network_id: '*',
    },
    ropsten: {
      provider: testnetProvider,
      network_id: 3,
      gas: 4600000,
    },
  },
};
