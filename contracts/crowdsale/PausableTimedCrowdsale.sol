pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/TimedCrowdsale.sol";


/**
 * @title PausableTimedCrowdsale
 * @dev Crowdsale can pause an.
 */
contract PausableTimedCrowdsale is Pausable, TimedCrowdsale {
    using SafeMath for uint256;
    
    event LogExtendClosingTime(uint256 pausedDuration, uint256 extendedClosingTime); 

    uint256 public pausedTime = 0;

    modifier onlyWhileOpen {
        require(block.timestamp >= openingTime && !hasClosed());  // REVIEW: better to reuse hasClosed()
        _;
    }
    
    /**
     * @dev Extend parent behavior setting time when get paused
     */
    function pause() onlyWhileOpen public { //REVIEW: MUST check if non-owner call fails   
        super.pause(); // onlyOwner whenNotPaused
        pausedTime = block.timestamp;
    }

    /**
     * @dev Extend parent behavior extending closingTIme when get unpaused
     */
    function unpause() public {
        super.unpause(); // onlyOwner whenPaused
        uint256 pausedDuration = block.timestamp.sub(pausedTime);
        pausedTime = 0;
        closingTime = closingTime.add(pausedDuration);
        emit LogExtendClosingTime(pausedDuration, closingTime);
    }

    /*
     * @dev Extend parent behavior with pause as not closed
     * @return Whether crowdsale period has elapsed
     */
    function hasClosed() public view returns (bool) {
        return !paused && super.hasClosed();
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