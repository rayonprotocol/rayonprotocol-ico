pragma solidity ^0.4.23;

import "./ownership/HasClaimableContracts.sol";
import "./crowdsale/PausableTimedCrowdsale.sol";
import "./crowdsale/PurchaseLimitedCrowdsale.sol";
import "./crowdsale/RefundablePostDeliveryMintedCrowdsale.sol";
import "openzeppelin-solidity/contracts/ownership/HasNoContracts.sol";
import "openzeppelin-solidity/contracts/ownership/Claimable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "openzeppelin-solidity/contracts/ownership/HasNoContracts.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/TimedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/WhitelistedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/distribution/PostDeliveryCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/distribution/FinalizableCrowdsale.sol";


/* solium-disable-next-line */
contract RayonTokenCrowdsale is
    Claimable,         // This is to change ownership of this contract
    HasNoContracts,     // This is to reclaim the ownership of Token
    HasClaimableContracts,// This is to achieve the ownership of Token
    PurchaseLimitedCrowdsale,
    WhitelistedCrowdsale,
    CappedCrowdsale,
    PausableTimedCrowdsale,
    RefundablePostDeliveryMintedCrowdsale
      //REVIEW: Looks redundant
    // REVIEW: Refundable is required
{
    constructor(
        // for Crowdsale
        uint256 _rate,
        address _wallet,
        MintableToken _token,
        // for PurchaseLimitedCrowdsale
        uint256 _minimumLimit,
        uint256 _maximumLimit,
        // for CappedCrowdsale
        uint256 _hardCap,
        // for TimedCrowdsale
        uint256 _openingTime,
        uint256 _closingTime,
        // for RefundableCrowdsale
        uint256 _softcap
    )
        public
        Crowdsale(_rate, _wallet, _token)
        PurchaseLimitedCrowdsale(_minimumLimit, _maximumLimit)
        CappedCrowdsale(_hardCap)
        TimedCrowdsale(_openingTime, _closingTime)
        RefundableCrowdsale(_softcap)
    {}

    // REVIEW: withdrawToken BETTER emit an event.
    // REIVEW: PostDeliveryCrowdsale SHOULD be extended into OwnerCanDeliveryCrowdsale 
            //which the owner is allowed to withdraw token for a beneficiary or beneficiaries
}