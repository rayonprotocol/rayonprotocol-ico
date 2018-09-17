pragma solidity ^0.4.21;

import "../crowdsale/RefundablePostDeliveryMintedCrowdsale.sol";

/**
 * @title RefundablePostDeliveryMintedCrowdsaleImpl
 * @dev Implementation of RefundablePostDeliveryMintedCrowdsale
 */
contract RefundablePostDeliveryMintedCrowdsaleImpl is  RefundablePostDeliveryMintedCrowdsale {
    constructor (
        uint256 _openingTime,
        uint256 _closingTime,
        uint256 _rate,
        address _wallet,
        ERC20 _token,
        uint256 _softCap
    )
        public
        Crowdsale(_rate, _wallet, _token)
        TimedCrowdsale(_openingTime, _closingTime)
        RefundableCrowdsale(_softCap)
    {} 
}