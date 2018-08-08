
pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/ownership/Claimable.sol";
import "openzeppelin-solidity/contracts/ownership/HasNoEther.sol";
import "openzeppelin-solidity/contracts/token/ERC20/PausableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/CappedToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/BurnableToken.sol";
import "./token/IndividuallyPausableToken.sol";

contract RayonToken is Claimable, HasNoEther, CappedToken, PausableToken, IndividuallyPausableToken, BurnableToken {
    string public name = "RAYON";
    string public symbol = "RYN";
    uint8 public decimals = 18;
    constructor(
        // for CappedToken
        uint256 _cap
    )
        public
        CappedToken(_cap)
    {}
}