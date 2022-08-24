//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract SpeedBump {
    struct RequestedWithdrawls {
        uint timeToWait;
        uint amount;
    }
    mapping(address => RequestedWithdrawls) public balances;
    uint public timeToWaitInSeconds;
    event Deposit(address owner, uint amount);
    event Withdrawl(address requester, uint amount);

    constructor(uint _timeToWaitInSeconds) {
        timeToWaitInSeconds = _timeToWaitInSeconds;
    }

    function withdraw(uint amount) public payable {
        require(amount <= balances[msg.sender].amount, "Not enough balance");
        require(block.timestamp >= balances[msg.sender].timeToWait, "Waiting period is not over yet");
        balances[msg.sender].amount -= amount;
        balances[msg.sender].timeToWait = block.timestamp + timeToWaitInSeconds;
        payable(msg.sender).transfer(amount);
        emit Withdrawl(msg.sender, amount);
    }

    function deposit(uint amount) public payable {
        require(msg.value == amount, "Amount not correct");
        balances[msg.sender].amount += amount;
        emit Deposit(msg.sender, amount);
    }

    function getUserBalance() public view returns(uint) {
        return balances[msg.sender].amount;
    }

    function getUserWaitingPeriod() public view returns(uint) {
        return balances[msg.sender].timeToWait;
    }
}