pragma solidity ^0.4.23;

import "./ownership/HasClaimableContracts.sol";
import "openzeppelin-solidity/contracts/ownership/HasNoContracts.sol";
import "openzeppelin-solidity/contracts/ownership/Claimable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "openzeppelin-solidity/contracts/ownership/HasNoContracts.sol";
import "openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/TimedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/WhitelistedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/distribution/PostDeliveryCrowdsale.sol";

contract RayonTokenCrowdsale is Claimable, HasNoContracts, HasClaimableContracts, WhitelistedCrowdsale, CappedCrowdsale, MintedCrowdsale, PostDeliveryCrowdsale {
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
        Crowdsale(_rate, _wallet, _token)
        CappedCrowdsale(_cap)
        TimedCrowdsale(_openingTime, _closingTime)
    {}
}