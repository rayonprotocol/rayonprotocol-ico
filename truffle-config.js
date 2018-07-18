require('babel-register');
require('babel-polyfill');

const HDWalletProvider = require('truffle-hdwallet-provider');

const providerWithMnemonic = (
  mnemonic,
  providerUrl,
  addressIndex = 0,
  numAddresses = 5
) => !process.env.SOLIDITY_COVERAGE
  ? new HDWalletProvider(mnemonic, providerUrl, addressIndex, numAddresses)
  : undefined; // https://github.com/sc-forks/solidity-coverage/blob/master/docs/faq.md#using-alongside-hdwalletprovider

const devMnemonic = 'rhythm vicious awful truck hint boring scale debris embark forest decline salad';
const devProvider = providerWithMnemonic(devMnemonic, 'http://localhost:8545');

const infuraApiKey = 'JIA5eiNFvLhAStdxeTvb'; // Either use this key or get yours at https://infura.io/signup. It's free.
const testnetMnemonic = 'zoo you win van use two sun rib pig own now ten';
const testnetProvider = providerWithMnemonic(testnetMnemonic, `https://ropsten.infura.io/${infuraApiKey}`);

const mocha = process.env.GAS_REPORTER
  ? {
    reporter: 'eth-gas-reporter',
    reporterOptions: {
      currency: 'KRW',
      gasPrice: 5,
    },
  }
  : undefined;

module.exports = {
  networks: {
    coverage: {
      host: 'localhost',
      network_id: '*', // eslint-disable-line camelcase
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 0x01,
    },
    rpc: {
      host: 'localhost',
      network_id: '*', // eslint-disable-line camelcase
      port: 8545,
    },
    development: {
      host: 'localhost',
      provider: devProvider,
      gas: 90000000000,
      gasPrice: 1,
      network_id: '*', // eslint-disable-line camelcase
      port: 8545,
    },
    ropsten: {
      provider: testnetProvider,
      network_id: 3, // eslint-disable-line camelcase
      gas: 4600000,
    },
  },
  mocha,
};
