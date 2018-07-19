pragma solidity ^0.4.23;

import "./RayonToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/TimedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/WhitelistedCrowdsale.sol";


contract RayonTokenCrowdsale is WhitelistedCrowdsale, CappedCrowdsale, TimedCrowdsale, MintedCrowdsale {
    constructor(
        // for Crowdsale
        uint256 _rate,
        address _wallet,
        MintableToken _token,
        // for CappedCrowdsale
        uint256 _cap,
        // for TimedCrowdsale
        uint256 _openingTime,
        uint256 _closingTime
    )
        public
        Crowdsale(_rate, _wallet, _token)
        CappedCrowdsale(_cap)
        TimedCrowdsale(_openingTime, _closingTime)
    {}
}