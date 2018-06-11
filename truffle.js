var HDWalletProvider = require('truffle-hdwallet-provider');
var infura_apikey = 'JIA5eiNFvLhAStdxeTvb'; // Either use this key or get yours at https://infura.io/signup. It's free.

// 개발서버에서 배포하는 계정
var devMnemonic = 'rhythm vicious awful truck hint boring scale debris embark forest decline salad';

// 테스트넷에서 배포하는 계정
var mnemonic = 'zoo you win van use two sun rib pig own now ten';

module.exports = {
  networks: {
    development: {
      provider: function() {
        return new HDWalletProvider(devMnemonic, 'http://localhost:7545');
      },
      gas: 90000000000,
      gasPrice: 1,
      network_id: '*',
    },
    ropsten: {
      provider: function() {
        return new HDWalletProvider(mnemonic, 'https://ropsten.infura.io/' + infura_apikey);
      },
      network_id: 3,
      gas: 4600000,
    },
  },
};
