pragma solidity ^0.4.23;

import "../crowdsale/PurchaseLimitedCrowdsale.sol";


contract PurchaseLimitedCrowdsaleImpl is PurchaseLimitedCrowdsale {
    constructor (
        uint256 _minimumLimit,
        uint256 _maximumLimit,
        uint256 _rate,
        address _wallet,
        ERC20 _token
    )
        public
        Crowdsale(_rate, _wallet, _token)
        PurchaseLimitedCrowdsale(_minimumLimit, _maximumLimit)
    {}
}