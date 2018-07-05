pragma solidity ^0.4.23;

import "./RayonToken.sol";
import "./crowdsale/MintedCrowdsale.sol";
import "./crowdsale/TimedCrowdsale.sol";

contract RayonTokenCrowdsale is TimedCrowdsale, MintedCrowdsale {

    function RayonTokenCrowdsale(uint256 _openingTime, uint256 _closingTime, uint256 _rate, address _wallet, MintableToken _token) Crowdsale(_rate, _wallet, _token) TimedCrowdsale(_openingTime, _closingTime) public {
        // require(_openingTime >= now);
        // require(_closingTime >= _openingTime);
    }
}