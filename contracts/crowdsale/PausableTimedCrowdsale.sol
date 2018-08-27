pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/TimedCrowdsale.sol";


/**
 * @title PausableTimedCrowdsale
 * @dev Crowdsale can pause an.
 */
contract PausableTimedCrowdsale is Pausable, TimedCrowdsale {
    using SafeMath for uint256;
    
    // REVIEW: Add 'Log' prefix for all events,  Add uint256 totalPausedDuration
    event IncreaseTotalPausedDuration(uint256 pausedDuration); 

    uint256 public totalPausedDuration = 0;
    uint256 public pausedTime = 0;

    modifier onlyWhileOpen {
        uint256 blockTime = getTimestamp();
        require(blockTime >= openingTime && blockTime <= closingTime.add(totalPausedDuration));  // REVIEW: better to reuse hasClosed()
        _;
    }
    
    /**
     * @dev Extend parent behavior setting time when get paused
     */
    function pause() onlyWhileOpen public { //REVIEW: MUST check if non-owner call fails   BETTER TO add onlyOwner whenNotPaused
        //super.pause(); // 
        pausedTime = getTimestamp();
    }

    /**
     * @dev Extend parent behavior increasing totalPausedDuration when get unpaused
     */
    function unpause() public {  //REVIEW: BETTER TO add onlyOwner whenPaused
        super.unpause();
        _increaseTotalPausedDuration();
    }

    // REVIEW: Better to increase ClosingTime rather than increase totalPausedDuration
    function _increaseTotalPausedDuration() internal returns (bool) {  //REVIEW: BETTER to be private,  remove return
        //TODO: assert(getTimestamp() > pausedTime)
        uint256 pausedDuration = getTimestamp().sub(pausedTime);
        pausedTime = 0;
        totalPausedDuration = totalPausedDuration.add(pausedDuration);
        emit IncreaseTotalPausedDuration(pausedDuration);
        return true;
    }

    function getTimestamp() internal view returns (uint256) {  //REVIEW: MAY be better to remove this function just like TimedCrowdsale
        return block.timestamp;
    }

    /*
     * @dev Checks whether the period including totalPausedDuration in which the crowdsale is open has already elapsed.
     * @return Whether crowdsale period has elapsed
     */
    function hasClosed() public view returns (bool) {
        return getTimestamp() > closingTime.add(totalPausedDuration);  //REVIEW: MUST return false when Paused
    }

    /**
     * @dev Extend parent behavior requiring to be not puased
     * @param _beneficiary Token purchaser
     * @param _weiAmount Amount of wei contributed
     */
    function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal onlyWhileOpen whenNotPaused {
        super._preValidatePurchase(_beneficiary, _weiAmount);
    }

}