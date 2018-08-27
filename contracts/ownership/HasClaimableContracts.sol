pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/ownership/Claimable.sol";


/**
 * @title Contracts can claim pending ownership of other contract
 */
contract HasClaimableContracts is Ownable { //REVIEW MAY be better to be OwnershipClaimable
    /**
    * @param claimableContract Claimable The address of the Claimable contract
    */
    function claimContractOwnership(Claimable claimableContract) external onlyOwner {
        require(claimableContract != address(0));
        require(claimableContract != address(this));
        claimableContract.claimOwnership();
    }
}
