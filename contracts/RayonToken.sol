
pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/BurnableToken.sol";
import "./token/TransferLimitedToken.sol";


contract RayonToken is MintableToken, TransferLimitedToken, BurnableToken {
    string public name = "RAYON";
    string public symbol = "RYN";
    uint8 public decimals = 18;
}