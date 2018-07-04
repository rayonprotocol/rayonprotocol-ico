
pragma solidity ^0.4.23;

import "./token/MintableToken.sol";

contract RayonToken is MintableToken {
    string public name = "RAYON COIN";
    string public symbol = "RYN";
    uint8 public decimals = 18;
}