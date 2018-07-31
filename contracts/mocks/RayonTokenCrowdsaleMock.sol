pragma solidity ^0.4.23;

import "../RayonTokenCrowdsale.sol";

contract RayonTokenCrowdsaleMock is RayonTokenCrowdsale {
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
        RayonTokenCrowdsale(_rate, _wallet, _token, _cap, _openingTime, _closingTime)
    {}

    function mockSetOpeningTime(uint256 _openingTime) public {
        openingTime = _openingTime;
    }

    function mockSetClosingTime(uint256 _closingTime) public {
        closingTime = _closingTime;
    }
}