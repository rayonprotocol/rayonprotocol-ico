
pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/ownership/Claimable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/PausableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/BurnableToken.sol";
import "./token/IndividuallyPausableToken.sol";


contract RayonToken is Claimable, MintableToken, PausableToken, IndividuallyPausableToken, BurnableToken {
    string public name = "RAYON";
    string public symbol = "RYN";
    uint8 public decimals = 18;
}