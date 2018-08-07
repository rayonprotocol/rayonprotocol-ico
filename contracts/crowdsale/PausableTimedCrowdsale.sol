pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/TimedCrowdsale.sol";


/**
 * @title PausableTimedCrowdsale
 * @dev Crowdsale can pause an.
 */
contract PausableTimedCrowdsale is Pausable, TimedCrowdsale {
    using SafeMath for uint256;
    
    event IncreaseTotalPausedDuration(uint256 pausedDuration);

    uint256 public totalPausedDuration = 0;
    uint256 public pausedTime = 0;

    modifier onlyWhileOpen {
        uint256 blockTime = getTimestamp();
        require(blockTime >= openingTime && blockTime <= closingTime.add(totalPausedDuration));
        _;
    }
    
    /**
     * @dev Extend parent behavior setting time when get paused
     */
    function pause() onlyWhileOpen public {
        super.pause();
        pausedTime = getTimestamp();
    }

    /**
     * @dev Extend parent behavior increasing totalPausedDuration when get unpaused
     */
    function unpause() public {
        super.unpause();
        _increaseTotalPausedDuration();
    }

    function _increaseTotalPausedDuration() internal returns (bool) {
        uint256 blockTime = getTimestamp();
        require(blockTime >= pausedTime);
        uint256 pausedDuration = blockTime.sub(pausedTime);
        pausedTime = 0;
        totalPausedDuration = totalPausedDuration.add(pausedDuration);
        emit IncreaseTotalPausedDuration(pausedDuration);
        return true;
    }

    function getTimestamp() internal view returns (uint256) {
        return block.timestamp;
    }

    /*
     * @dev Checks whether the period in which the crowdsale is open has already elapsed.
     * @return Whether crowdsale period has elapsed
     */
    function hasClosed() public view returns (bool) {
        return getTimestamp() > closingTime.add(totalPausedDuration);
    }

}