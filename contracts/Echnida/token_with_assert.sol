//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
// Note: The issues from exercise 1 and 2 are fixed

contract Ownership{

    address owner = msg.sender;

    constructor() {
        owner = msg.sender;
    }

    modifier isOwner(){
        require(owner == msg.sender);
        _;
    }
}

contract Pausable is Ownership{

    bool is_paused;

    modifier ifNotPaused(){
        require(!is_paused);
        _;
    }

    function paused() isOwner public{
        is_paused = true;
    }

    function resume() isOwner public{
        is_paused = false;
    }

}

contract Token is Pausable{
    mapping(address => uint) public balances;

    function transfer(address to, uint value) ifNotPaused public{
        require(balances[msg.sender] >= value);
        uint originalFromBalance = balances[msg.sender];
        uint originalToBalance = balances[to];
        balances[msg.sender] -= value;
        balances[to] += value;
        assert(balances[msg.sender]<=originalFromBalance);
        assert(balances[to]>=originalToBalance);
    }
}