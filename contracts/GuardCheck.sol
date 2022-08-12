//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
/**
    Gaurd Check pattern:

    Ensure that the behavior of a smart contract and its input parameters are as expected.
    This pattern uses assert() & require() statements which are used to catch exception in solidity.
    A smart contract function execution depends on its inputs and context.
    Proper input and context validation before making state change is absolutely important. 
    In case of any shortcoming in validation of inputs and execution conditions, the contract should prevent state changes and revert successfully. 
    Solidity uses require and assert statements for reverting gracefully.

    Require uses the REVERT opcode and Assert uses the INVALID opcode. Both are used to check the conditions withing the smart contract function.
    The primary difference between both statements is that require statement refunds all the unused gas to the caller, but assert statement uses all the remaining gas. 
    Ultimately, both transactions end up reverting on a false condition without making any state changes. Require is also able to return a value to the caller, while assert returns either true or false.

    The documentation recommends that assert should be only used towards the end of the function to check invariants within the function.
    On the other hand, require should be used to ensure valid execution conditions and input params. The documentation recommends that require should be used towards the beginnening of the function 

 */
contract GuardCheck {
    uint public condition;
    
    function test(uint _condition) public {
        require(_condition == 0, "condition is not 0");
        require(msg.sender != address(0), "address can't be 0");
        require(condition == 0, "Its been set");
        condition = _condition + uint(5);
        assert(condition == uint(5));
    }
}
