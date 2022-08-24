//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
/**
    Rate Limit contracts: 
        This design pattern limits the amount of an action. 
        For example, The RateLimitAmount contract limits the amount being withdrawn for a specific amount of time
                     Using this approach, the contract could limit the amount to say 100 Ether per day. 

                     Similarly, RateLimitFunctionInvocation only allows the invocation of withdrawl function a single time for an x amount of time.  


 */
contract RateLimitAmountBeingWithdrawn {
    uint public period; // block number
    uint public limitAmount; // total limit amount
    uint public amountTakenOut;
    uint public currentPeriodEnd;

    constructor(uint _period, uint _limitAmount) payable {
        period = _period;
        limitAmount = _limitAmount;
        currentPeriodEnd = block.number + period;
    }

    function withdraw(uint _amount) public payable {
        updatePeriod(); 
        require(msg.value == _amount, "Value does not equal amount");
        require(amountTakenOut < limitAmount, "Overflown");
        amountTakenOut += msg.value;
        payable(msg.sender).transfer(msg.value);
    }

    function updatePeriod () internal {
        if(block.number > currentPeriodEnd){
            currentPeriodEnd = block.number + period;
            amountTakenOut = 0;
        }
    }
}

contract RateLimitFunctionInvocation {
    uint public currentPeriodEnd;

    constructor() payable {
        currentPeriodEnd = block.timestamp + 5 minutes;
    }

    function withdraw(uint _amount) public payable allowInvocation {
        require(msg.value == _amount, "Value does not equal amount");
        payable(msg.sender).transfer(msg.value);
    }

    modifier allowInvocation () {
        if(block.timestamp > currentPeriodEnd) {
            currentPeriodEnd = block.timestamp + 5 minutes;
            _;
        } else {
            revert("try after 5 minutes");
        }
    }
}