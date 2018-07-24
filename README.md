# RayonProtocol ICO 

This is RayonProtocol's ICO [Smart Contracts](https://en.wikipedia.org/wiki/Smart_contract) prototype based on ERC20, using [OpenZeppelin](https://github.com/OpenZeppelin/), [TokenMarketNet](https://github.com/TokenMarketNet) and [DAICO](https://github.com/theabyssportal/DAICO-Smart-Contract). 

Kindly note that this is a prototype and additional functions with regards to the ICO process will be added.

* [Requirements](https://findainc.atlassian.net/wiki/spaces/BLOC/pages/322240835/23.+Token+ICO)

### RayonToken
![RayonToken](doc/RayonToken.png)

### RayonTokenCrowdsale
![RayonTokenCrowdsale](doc/RayonTokenCrowdsale.png)

### Development
#### Enviroment variables
Complete `.env.example` file to set enviroment variables used for truffle configuration

#### Test
```bash
# test smart contracts
yarn test 

# test coverage
yarn coverage # generate coverage reports
open coverage/index.html # open reports
```

#### Deploy
```bash
# deploy to development network
yarn migrate:dev
```

#### Verify contracts on Etherscan
[solidity-flattener](https://github.com/BlockCatIO/solidity-flattener) is required to perform below

```bash
# flatten contracts
yarn flatten

# solidity compiler version
yarn truffle version
```

See [package.json](package.json) to find out more commands
