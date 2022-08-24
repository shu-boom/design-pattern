//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./token.sol";

contract MintableToken is Token {
    uint256 public totalMinted;
    uint256 public totalMintable;

    constructor(uint256 _totalMintable) {
        totalMintable = _totalMintable;
    }

    function mint(uint256 value) public isOwner {
        require((uint256(value) + totalMinted) < totalMintable);
        totalMinted += uint256(value);
        balances[msg.sender] += value;
    }
}
