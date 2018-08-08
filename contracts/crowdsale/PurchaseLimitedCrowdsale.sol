pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/crowdsale/Crowdsale.sol";


contract PurchaseLimitedCrowdsale is Crowdsale {
    using SafeMath for uint256;
    
    mapping(address => uint256) public contributions;

    uint256 public minimumLimit;
    uint256 public maximumLimit;

    constructor(
        uint256 _minimumLimit,
        uint256 _maximumLimit
    ) {
        require(_minimumLimit > 0 && _minimumLimit <= _maximumLimit);
        minimumLimit = _minimumLimit;
        maximumLimit = _maximumLimit;
    }

    /**
     * @dev Extend parent behavior requiring purchase to be in range between minimumLimit and maximumLimit
     * @param _beneficiary Token purchaser
     * @param _weiAmount Amount of wei contributed
     */
    function _preValidatePurchase(
        address _beneficiary,
        uint256 _weiAmount
    )
        internal
    {
        super._preValidatePurchase(_beneficiary, _weiAmount);
        uint256 beneficiaryWeiRaising = contributions[_beneficiary].add(_weiAmount);
        require(minimumLimit <= beneficiaryWeiRaising && maximumLimit >= beneficiaryWeiRaising);
    }

    /**
     * @dev Extend parent behavior to update user contributions
     * @param _beneficiary Token purchaser
     * @param _weiAmount Amount of wei contributed
     */
    function _updatePurchasingState(
        address _beneficiary,
        uint256 _weiAmount
    )
        internal
    {
        super._updatePurchasingState(_beneficiary, _weiAmount);
        contributions[_beneficiary] = contributions[_beneficiary].add(_weiAmount);
    }
}