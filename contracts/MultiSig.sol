//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
/**
    Multi-Signature wallet allows many parties to have access to the funds stored in a contract. 
    Each contract is essentially a wallet.
    The following is a simple implementation of such contract.
    Contract has multiple owners.
    The contract allows anyone to deposit money.
    The contract maintains a 3 minimum confirmations to execute a transaction. 
    The original owner of the contract allows users to add more owners
    Only confirmed transactions are allowed to be executed and transfer    
 
 */
contract MultiSig {
    // State Variables
    address public _owner;

    // Min transaction
    uint public constant MIN_CONFIRMATION = 2; 
    // This is simple and rigid. Can also be driven by a simple 
    // formula and can be dynamic using some restrictive policy for updation
  
    // This structure represent a transaction
    struct Transaction {
        address to;
        address from;
        bool executed;
        uint amount;
        uint numOfConfirmations;
        mapping(address => bool) approvers; // may save gas costs using some smaller type than bool
    }

    // Total number of transactions. THIS UPDATES SEQUENTIALLY. 
    uint public totalTransactions;
    uint public currentlyPendingTransactions;

    // A sparse data structure to hold the transactions
    mapping(uint => Transaction) public transactions;

    // For simplicity, sticking with boolean but could be an ENUM with different roles of users defined. 
    // Remember enums will be written as uint8 and give easy access to predefined types
    mapping(address => bool) public validators; 

    // Events 
    event Deposit(address _from, uint _amount);
    event ValidatorAdded(address _validator);
    event TransactionCreated(address _from, address _to, uint amount, uint id);
    event TransactionConfirmed(address _validator, uint id);
    event TransactionExecuted(address _from, address _to, uint amount, uint id);

    // Constructor 
    constructor() {
        _owner = msg.sender;
        validators[msg.sender] = true;
    }

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == _owner, "Only Owner Allowed!");
        _;
    }

    modifier onlyValidator() {
        require(validators[msg.sender], "Only Validator Allowed!");
        _;
    }

    /**
        Only owner can add new validators. 
     */
    function addValidator(address _validator) public onlyOwner {
        require(address(0) != _validator, "Validator cant be zero address");
        require(validators[_validator] == false, "Validator already added");
        validators[_validator] = true;
        emit ValidatorAdded(_validator);
    }

    /**
        Get Validator Status
     */
    function isValidator(address _validator) public view returns(bool){
        return validators[_validator];
    }

    // Implement incoming deposits. Mo Money Mo Money Mo Money is always welcome! 
    receive() external payable
    {
        emit Deposit(msg.sender, msg.value);
    }
    
    fallback() external payable
    {
        emit Deposit(msg.sender, msg.value);
    }

    /**
        Get Transaction Details
     */
    function getTransactionDetails(uint _transactionId) public view returns( 
        address recepient,
        address sender,
        bool executed,
        uint amount,
        uint numOfConfirmations
    ) {
        Transaction storage _transaction = transactions[_transactionId];
        require(address(0) != _transaction.from, "Transaction does not exists");
        return (
        _transaction.to, 
        _transaction.from,
        _transaction.executed, 
        _transaction.amount, 
        _transaction.numOfConfirmations);
    }

    /**
        This creates a transaction for gaining approval from the administrators.
     */
    function transfer(address _to, uint _amount) public payable{
        require(address(0) != _to, "Recepient can't be zero address");
        require(msg.value > 0, "Amount must be greater than 0");
        require(msg.value == _amount, "Zero address not allowed");
        uint transactionId = totalTransactions++;
        currentlyPendingTransactions++;
        Transaction storage _transaction = transactions[transactionId];
        _transaction.from = msg.sender;
        _transaction.to = _to;
        _transaction.executed = false;
        _transaction.amount = msg.value;
        _transaction.numOfConfirmations = 0;
        emit TransactionCreated(msg.sender, _to, msg.value, transactionId);
    }  

   /**
    Confirm the transaction using transaction id.
            Constraints
                -> Validator must neither be sender nor recepient. 
                -> Amount must be less than the account balance.
                -> Transaction must not be executed 
                -> Tansaction must have less confirmations than MIN_CONFIRMATION\
            Context
                -> Amount should have been there because each transfer adds appropritate balance to the account 
                -> If the minConfirmation is reached execute the transaction 
                -> Validators pay the transaction fee. Asking user to pay twice is just mean! 
    */
    function confirmTransaction(uint _transactionId) external onlyValidator {
        Transaction storage _transaction = transactions[_transactionId];
        require(!(_transaction.executed), "Transaction already executed");
        require(_transaction.from != msg.sender, "Validator cant be the sender");
        require(_transaction.to != msg.sender, "Validator cant be the recepient");
        require(address(this).balance >= _transaction.amount, "Is we HaCked!!" );
        require(!_transaction.approvers[msg.sender], "Already Validated!" );
        _transaction.numOfConfirmations++;
        _transaction.approvers[msg.sender] = true; 
        emit TransactionConfirmed(msg.sender, _transactionId);
        if(_transaction.numOfConfirmations >= MIN_CONFIRMATION) {
            _transaction.executed = true;
            currentlyPendingTransactions--;
            emit TransactionExecuted(_transaction.from, _transaction.to, _transaction.amount, _transactionId);
            payable(_transaction.to).transfer(_transaction.amount);
        }
    }

    /**   
        Returns a list of pending transactions
    */
    function getAllPendingTransactions() external view onlyValidator returns (uint[] memory) {
        uint[] memory pendingTransactions = new uint[](currentlyPendingTransactions);
        uint count = 0;
        for(uint i=0; i < totalTransactions; i++) {
            Transaction storage _transaction = transactions[i];
            if(!_transaction.executed){
                pendingTransactions[count] = i;
                count++;
            }
        }
        return pendingTransactions;
    }

    function getBalance() external view returns(uint) {
        return address(this).balance;
    }
}
