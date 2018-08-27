pragma solidity ^0.4.23;

import "../crowdsale/PausableTimedCrowdsale.sol";


contract PausableTimedCrowdsaleMock is PausableTimedCrowdsale {
    constructor (
        uint256 _openingTime,
        uint256 _closingTime,
        uint256 _rate,
        address _wallet,
        ERC20 _token
    )
        public
        Crowdsale(_rate, _wallet, _token)
        TimedCrowdsale(_openingTime, _closingTime)
    {}

    uint256 internal mockTime;

    function getTimestamp() internal view returns (uint256) {
        if (mockTime > 0) {
            return mockTime;
        }
        return super.getTimestamp();
    }

    function mockSetTimestamp(uint256 _time) public {
        mockTime = _time;
    }

    // REVIEW: mock class has special capability that it can change values of members of super contract
    //         blockbox test and the accurate original contract's behavior test become impossible.
    function mockSetOpeningTime(uint256 _openingTime) public {
        openingTime = _openingTime;
    }

    function mockSetClosingTime(uint256 _closingTime) public {
        closingTime = _closingTime;
    }
    
    function mockSetPausedTime(uint256 _pausedTime) public {
        pausedTime = _pausedTime;
    }

}