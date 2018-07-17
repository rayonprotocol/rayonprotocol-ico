pragma solidity ^0.4.21;

import "./StandardToken.sol";
import "../lifecycle/Pausable.sol";
import "../ownership/Ownable.sol";


/**
 * @title TransferLimitedToken
 * @dev Token with ability to limit transfers within wallets included in limitedWallets list for certain period of time
 */
contract TransferLimitedToken is StandardToken, Pausable {

    mapping(address => bool) public limitedWallets;
    bool public isLimitEnabled = false;


    /**
     * @dev Check if transfer between addresses is available
     * @param _from From address
     * @param _to To address
     */
    modifier canTransfer(address _from, address _to)  {
        require(!isLimitEnabled || (!limitedWallets[_from] && !limitedWallets[_to]));
        _;
    }

    /**
     * @dev Add address to limitedWallets
     * @dev Can be called only by owner
     */
    function addLimitedWalletAddress(address _wallet) public onlyOwner {
        limitedWallets[_wallet] = true;
    }

    /**
     * @dev Del address from limitedWallets
     * @dev Can be called only by owner
     */
    function delLimitedWalletAddress(address _wallet) public onlyOwner {
        limitedWallets[_wallet] = false;
    }

    function isLimitedWalletAddress(address _wallet) public view returns(bool) {
        return limitedWallets[_wallet];
    }

    /**
     * @dev enable transfer limit manually. Can be called only by owner
     */
    function enableLimit() public onlyOwner {
        isLimitEnabled = true;
    }

    /**
     * @dev Disable transfer limit manually. Can be called only by owner
     */
    function disableLimit() public onlyOwner {
        isLimitEnabled = false;
    }

    /**
     * @dev Override transfer function. Add canTransfer modifier to check possibility of transferring
     */
    function transfer(address _to, uint256 _value) public whenNotPaused canTransfer(msg.sender, _to) returns (bool) {
        return super.transfer(_to, _value);
    }

    /**
     * @dev Override transferFrom function. Add canTransfer modifier to check possibility of transferring
     */
    function transferFrom(address _from, address _to, uint256 _value) public whenNotPaused canTransfer(_from, _to) returns (bool) {
        return super.transferFrom(_from, _to, _value);
    }

    /**
     * @dev Override approve function. Add canTransfer modifier to check possibility of transferring
     */
    function approve(address _spender, uint256 _value) public whenNotPaused canTransfer(msg.sender, _spender) returns (bool) {
        return super.approve(_spender,_value);
    }
}