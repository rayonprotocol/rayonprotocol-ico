pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


/**
 * @title IndividuallyPausableToken
 * @dev Token with ability to pause transfers within wallets included in pausedAddressese
 */
contract IndividuallyPausableToken is StandardToken, Ownable {
    // REVIEW: Add "Log" prefix for events
    event PauseAddress(address indexed pausedAddress);
    event UnpauseAddress(address indexed unpausedAddress);
    event EnableIndividualPause();
    event DisableIndividualPause();

    mapping(address => bool) public pausedAddresses; //REVIEW: addressesPaused
    bool public individualPauseEnabled = false;  //REVIEW: MAY not be necessary to turn on/off wholy
    
    /**
     * @dev Modifier to make a function callable only when the contract is individualPauseEnabled.
     */
    modifier whenIndividualPauseEnabled()  {
        require(individualPauseEnabled);
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is not individualPauseEnabled.
     */
    modifier whenIndividualPauseNotEnabled()  {
        require(!individualPauseEnabled);
        _;
    }

    /** REVIEW: this function is not necessary.
     * @dev Modifier to make a function callable only when contract is not individualPauseEnabled or the given addresses are not paused.
     * @param _from From address
     * @param _to To address
     */
    modifier whenNotIndividuallyPausedWithin(address _from, address _to)  {
        require(!individualPauseEnabled || (!pausedAddresses[_from] && !pausedAddresses[_to]));
        _;
    }

    /**
     * @dev Modifier to make a function callable only when contract is not individualPauseEnabled or the given address is not paused.
     * @param _operator address to check
     */
    modifier whenNotIndividuallyPaused(address _operator)  {
        require(!individualPauseEnabled || !pausedAddresses[_operator]);
        _;
    }

    /**
     * @dev called by the owner
     * @dev set given address in pausedAddresses true
     */
    function pauseAddress(address _address) public onlyOwner {
        require(!isPausedAddress(_address));
        pausedAddresses[_address] = true;
        emit PauseAddress(_address);
    }

    /**
     * @dev called by the owner
     * @dev set given address in pausedAddresses false
     */
    function unpauseAddress(address _address) public onlyOwner {
        require(isPausedAddress(_address));
        pausedAddresses[_address] = false;
        emit UnpauseAddress(_address);
    }

    /**
     * @dev returns if given address is paused
     */
    function isPausedAddress(address _address) public view returns(bool) {
        return pausedAddresses[_address];
    }

    /**
     * @dev called only by owner 
     * @dev enable individual transfer pause. 
     */
    function enableIndividualPause() public whenIndividualPauseNotEnabled onlyOwner {
        individualPauseEnabled = true;
        emit EnableIndividualPause();
    }

    /**
     * @dev called only by owner 
     * @dev Disable individual transfer pause.
     */
    function disableIndividualPause() public whenIndividualPauseEnabled onlyOwner {
        individualPauseEnabled = false;
        emit DisableIndividualPause();
    }

    function transfer(
        address _to,
        uint256 _value
    )
        public
        // REVIEW whenNotIndividuallyPaused(msg.sender)
        whenNotIndividuallyPausedWithin(msg.sender, _to)
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
        whenNotIndividuallyPausedWithin(_from, _to) //REVIEW: NOT NEED TO consider _to
        //REVIEW: whenNotIndividuallyPaused(_from)
        whenNotIndividuallyPaused(msg.sender)
        returns (bool)
    {
        return super.transferFrom(_from, _to, _value);
    }

    // REVIEW: MAY be unnecessary to disable approve, increaseApproval, decreaseApproval
    function approve(
        address _spender,
        uint256 _value
    )
        public
        whenNotIndividuallyPausedWithin(msg.sender, _spender)
        returns (bool)
    {
        return super.approve(_spender,_value);
    }

    function increaseApproval(
        address _spender,
        uint _addedValue
    )
        public
        whenNotIndividuallyPausedWithin(msg.sender, _spender)
        returns (bool success)
    {
        return super.increaseApproval(_spender, _addedValue);
    }

    function decreaseApproval(
        address _spender,
        uint _subtractedValue
    )
        public
        whenNotIndividuallyPausedWithin(msg.sender, _spender)
        returns (bool success)
    {
        return super.decreaseApproval(_spender, _subtractedValue);
    }
}