
//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "./MintableToken.sol";

contract TestMintableToken is MintableToken {
    address echidna_caller;

    constructor() MintableToken(10000){
        echidna_caller = msg.sender;
        owner = msg.sender;
        balances[echidna_caller] = 10000;
    }

    function echidna_test_balance() public view returns (bool) {
        return balances[msg.sender] <= 10000;
    }
}