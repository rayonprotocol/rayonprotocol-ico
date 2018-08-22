# RayonProtocol ICO 

This is RayonProtocol's ICO (Token & Crowdsale) [Smart Contracts](https://en.wikipedia.org/wiki/Smart_contract) prototype based on ERC20, using [OpenZeppelin](https://github.com/OpenZeppelin/), [TokenMarketNet](https://github.com/TokenMarketNet) and [DAICO](https://github.com/theabyssportal/DAICO-Smart-Contract). 

## About

### [Requirements](https://findainc.atlassian.net/wiki/spaces/BLOC/pages/322240835/23.+Token+ICO)

### RayonToken Architecture
![RayonToken](doc/RayonToken.png)

### RayonTokenCrowdsale Architecture
![RayonTokenCrowdsale](doc/RayonTokenCrowdsale.png)

## Getting Started
### Prerequisites
- Install NodeJS 8.0 or higher version
- Install Ganache

### Installing
- install all dependencies
```bash
npm install
```
- Create .env file : Fill `.env.example` file to set enviroment variables used for truffle configuration and rename it to '.env'
INFURA_API_KEY value is required when deployed in testnet.
Input any valid mnemonic as MNEMONIC value

### Deployment
- Run Ganache and change the port number to 8548, as specified in the truffle-config.js file. Ganache is a node of local blockchain network.

- Deploy smart contracts on the local blockchain network

```bash
npm run migrate:dev
```

### Interact with the deployed smart contracts on console
Truffle provides console where user can interact with the blockchain and the smart contracts deployed on it.
```bash
truffle console

# truffle(development)> web3.eth.getAccounts(function(err,res) { accounts = res; });
undefined
# truffle(development)> accounts
[ '0xcb22e722bb9034d14341ad2e8665846b9baf0454',
  '0x0dc529cbc45a354634f2b62460ad04a1550c0ed4',
  '0x35e3d59481dc23aca2b695a6709c4f74a4711e3f',
  '0x0d98779c4abc930b1cb47c07c076a869909f17b9',
  '0xbeff5ee02d655e04ee0d73095fc3fa99fcb90743' ]

TOBEWRITTEN: More interactions such as minting, trasfering and retrieving balance.
```

### Running the tests
```bash
# test smart contracts
npm run test 

# test coverage
npm run coverage # generate coverage reports
open coverage/index.html # open reports
```

### Flattening contracts
In order to register smart contract code on [Etherscan](https://etherscan.io/), flattening is required.

Install [solidity-flattener](https://github.com/BlockCatIO/solidity-flattener) first.
And then,

```bash
# flatten contracts
npm run flatten

# solidity compiler version
npm run truffle version
```

### More
See [package.json](package.json) to find out more commands

## Built With
* [NodeJS](https://nodejs.org/en/) - The platform where Truffle runs on top of
* [Truffle](https://truffleframework.com/) - Ethereum Smart Contract Framework
* [Solidity](https://github.com/ethereum/solidity) - Used to develop the Reverse Inquiry smart contracts
* [OpenZeppelin](https://github.com/OpenZeppelin/) - Provides basic token and crowdsale functionality based on smart contracts on Ethereum

## Acknowledgments
* Kindly note that this is a prototype and additional functions with regards to the ICO process will be added.
