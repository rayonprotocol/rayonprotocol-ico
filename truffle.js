var HDWalletProvider = require("truffle-hdwallet-provider");
var infura_apikey = "JIA5eiNFvLhAStdxeTvb"; // Either use this key or get yours at https://infura.io/signup. It's free.
var mnemonic = "zoo you win van use two sun rib pig own now ten";

module.exports = {
    networks: {
        development: {
            host: "localhost",
            port: 8545,
            network_id: "*" // Match any network id
        },
        ropsten: {
            provider: function () {
                return new HDWalletProvider(mnemonic, "https://ropsten.infura.io/" + infura_apikey);
            },
            network_id: 3,
            gas: 5000000
        }
    }
};