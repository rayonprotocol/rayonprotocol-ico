pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


/**
 * @title IndividuallyPausableToken
 * @dev Token with ability to pause transfers within wallets included in pausedAddressese
 */
contract IndividuallyPausableToken is StandardToken, Ownable {

    event LogPauseAddress(address indexed pausedAddress);
    event LogUnpauseAddress(address indexed unpausedAddress);

    mapping(address => bool) public pausedAddresses;

    /**
     * @dev Modifier to make a function callable only when the given address is not paused.
     * @param _operator address to check
     */
    modifier whenNotIndividuallyPaused(address _operator)  {
        require(!pausedAddresses[_operator]);
        _;
    }

    /**
     * @dev called by the owner
     * @dev set given address in pausedAddresses true
     */
    function pauseAddress(address _address) public onlyOwner {
        require(!pausedAddresses[_address]);
        pausedAddresses[_address] = true;
        emit LogPauseAddress(_address);
    }

    /**
     * @dev called by the owner
     * @dev set given address in pausedAddresses false
     */
    function unpauseAddress(address _address) public onlyOwner {
        require(pausedAddresses[_address]);
        pausedAddresses[_address] = false;
        emit LogUnpauseAddress(_address);
    }

    function transfer(
        address _to,
        uint256 _value
    )
        public
        // REVIEW whenNotIndividuallyPaused(msg.sender)
        whenNotIndividuallyPaused(msg.sender)
        whenNotIndividuallyPaused(_to)
        returns (bool)
    {
        return super.transfer(_to, _value);
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    )
        public
        whenNotIndividuallyPaused(_from)
        whenNotIndividuallyPaused(_to)
        whenNotIndividuallyPaused(msg.sender)
        returns (bool)
    {
        return super.transferFrom(_from, _to, _value);
    }

    function approve(
        address _spender,
        uint256 _value
    )
        public
        whenNotIndividuallyPaused(msg.sender)
        whenNotIndividuallyPaused(_spender)
        returns (bool)
    {
        return super.approve(_spender,_value);
    }

    function increaseApproval(
        address _spender,
        uint _addedValue
    )
        public
        whenNotIndividuallyPaused(msg.sender)
        whenNotIndividuallyPaused(_spender)
        returns (bool success)
    {
        return super.increaseApproval(_spender, _addedValue);
    }

    function decreaseApproval(
        address _spender,
        uint _subtractedValue
    )
        public
        whenNotIndividuallyPaused(msg.sender)
        whenNotIndividuallyPaused(_spender)
        returns (bool success)
    {
        return super.decreaseApproval(_spender, _subtractedValue);
    }
}