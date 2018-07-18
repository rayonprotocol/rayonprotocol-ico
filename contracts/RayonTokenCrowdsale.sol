pragma solidity ^0.4.23;

import "./RayonToken.sol";
import "openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/TimedCrowdsale.sol";


contract RayonTokenCrowdsale is TimedCrowdsale, MintedCrowdsale {
    function RayonTokenCrowdsale(
        uint256 _openingTime,
        uint256 _closingTime,
        uint256 _rate,
        address _wallet,
        MintableToken _token
    )
        public
        Crowdsale(_rate, _wallet, _token)
        TimedCrowdsale(_openingTime, _closingTime)
    {
        // require(_openingTime >= now);
        // require(_closingTime >= _openingTime);
    }
}