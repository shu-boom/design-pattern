
//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./token.sol";

contract TestToken is Token {
    address echidna_caller = msg.sender;

    constructor() {
        balances[echidna_caller] = 10000;
        paused(); // pause the contract
        owner = address(0); // lose ownership
    }

    function echidna_test_balance() public view returns (bool) {
        return balances[echidna_caller] <= 10000;
    }

    function echidna_no_transfer() public view returns (bool) {
        return is_paused;
    }
}