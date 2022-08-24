//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
/**
   CircuitBraker Pattern:
    In this pattern, some of the most important actions are stopped using a security flag. 
    Only a trusted party or a set of trusted parties (using multisig) are allowed to change the contract to emergency in order to prevent funds from hacking.

    In this contract, anyone can deposit and withdraw a balance as long as the contract is not in emergency
    Once the contract enters emergency mode, only a trusted party is allowed to remove fund.
 */
contract CircuitBraker {
    bool public contractStopped = false;
    address public owner;
    event OwnerWithdrawInEmergency(uint amount);

    constructor() payable {
        owner = msg.sender;
    }

    modifier openInEmergency() {
        require(contractStopped, "Contract is currently NOT in Emergency");
        _;
    }

    modifier closeInEmergency() {
        require(!contractStopped, "Contract is currently in Emergency");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only Owner Allowed!");
        _;
    }

    function toggleEmergency() external onlyOwner {
        contractStopped = !contractStopped;
    }

    function deposit() external payable closeInEmergency {
    }

    function withdraw(uint balance) external payable closeInEmergency {
        require(balance <= address(this).balance);
        payable(msg.sender).transfer(balance);
    }

    function emergency_withdraw() external payable openInEmergency onlyOwner{
        emit OwnerWithdrawInEmergency(address(this).balance);
        payable(owner).transfer(address(this).balance);
    }

    function getBalance() external view returns(uint) {
        return address(this).balance;
    }
}