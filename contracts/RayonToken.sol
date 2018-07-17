
pragma solidity ^0.4.23;

import "./token/MintableToken.sol";
import "./token/TransferLimitedToken.sol";


contract RayonToken is MintableToken, TransferLimitedToken {
    string public name = "RAYON";
    string public symbol = "RYN";
    uint8 public decimals = 18;
}