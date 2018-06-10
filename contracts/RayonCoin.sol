
pragma solidity ^0.4.23;

import "zeppelin-solidity/contracts/token/ERC20/MintableToken.sol";

contract RayonCoin is MintableToken {
    string public name = "RAYON COIN";
    string public symbol = "RYN";
    uint8 public decimals = 18;
}