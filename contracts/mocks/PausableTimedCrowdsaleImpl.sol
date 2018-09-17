pragma solidity ^0.4.23;

import "../crowdsale/PausableTimedCrowdsale.sol";


contract PausableTimedCrowdsaleImpl is PausableTimedCrowdsale {
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
}