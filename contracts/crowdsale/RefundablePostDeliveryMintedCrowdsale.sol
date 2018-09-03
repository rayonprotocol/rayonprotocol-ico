pragma solidity ^0.4.21;

import "../token/IndividuallyPausableToken.sol";
import "openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/distribution/RefundableCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/distribution/PostDeliveryCrowdsale.sol";

/**
 * @title RefundablePostDeliveryMintedCrowdsale
 * @dev RefundablePostDeliveryMintedCrowdsale
 */
contract RefundablePostDeliveryMintedCrowdsale is MintedCrowdsale, PostDeliveryCrowdsale, RefundableCrowdsale {
    
    event LogWithdrawTokens(address indexed beneficiary);
    
    /**
     * @dev Extend parent behavior requiring both isFinalized and goalReached to be true
     */
    function withdrawTokens() public {
        require(isFinalized);
        require(goalReached());
        super.withdrawTokens();
        emit LogWithdrawTokens(msg.sender);
    }
    
    /**
     * @dev Extend parent behavior requiring hasClosed
     */
    function finalization() internal {
        require(hasClosed());
        super.finalization();
    }
}