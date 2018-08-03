pragma solidity ^0.4.21;

import "../token/IndividuallyPausableToken.sol";


/**
 * @title IndividuallyPausableTokenMock
 * @dev Mocking contract of IndividuallyPausableToken
 */
contract IndividuallyPausableTokenMock is IndividuallyPausableToken {

    function mockAddBalance(address _to, uint256 _balacne) public returns (bool) {
        totalSupply_ = totalSupply_.add(_balacne);
        balances[_to] = balances[_to].add(_balacne);
        return true;
    }

}