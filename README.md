# RayonProtocol ICO 

This is RayonProtocol's ICO [Smart Contracts](https://en.wikipedia.org/wiki/Smart_contract) on Ethereum, based on [OpenZeppelin](https://github.com/OpenZeppelin/)  


## Getting Started

Need install ganache-cli to test on private testnet.
This progect integrates with [Truffle](https://github.com/ConsenSys/truffle), an Ethereum development environment. Please install Truffle and initialize your project with `truffle init`.

```sh
$ npm install -g ganache-cli
$ npm install -g truffle
$ cd rayonprotocol-ico
$ npm install zeppelin-solidity@1.7.0

```

To build run:
```sh
$ truffle compile
```

To deploy Smart Contracts run:
```sh
$ ganache-cli
$ truffle migrate
```

## Interact with Smart Contracts

Open truffle console to interact with the deployed Smart Contract using Web3:
```sh
$ truffle console
```

Now Call Web3 functions
```sh
TODO: Write details
```

# TODO
 - 소프트, 하드 캡 기능 구현
 - ICO 기간 설정
 - KYC 및 ICO 허용 지갑 주소 등록
 - 지갑 주소 별 최소, 최대 참여 토큰 설정...
