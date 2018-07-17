pragma solidity ^0.4.21;

import "../token/TransferLimitedToken.sol";


/**
 * @title TransferLimitedTokenMock
 * @dev Mocking contract of TransferLimitedToken
 */
contract TransferLimitedTokenMock is TransferLimitedToken {

    function mockSetBalance(address _to, uint256 _balacne) public returns (bool) {
        totalSupply_ = totalSupply_.add(_balacne.sub(balances[_to]));
        balances[_to] = balances[_to].add(_balacne);
        return true;
    }

}