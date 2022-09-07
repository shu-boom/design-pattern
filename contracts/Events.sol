//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

/**
    Event Storage and Subscription
        Contracts are able to emit events and important information for clients could be passed using these events
        Note that the information passed in the events are solely for logging purposes
        Therefore, other contracts cant subscribe or read the emitted events 
*/

contract Events {
   event Emitted(address, uint);
   event IndexedEvent(address indexed from, address indexed to, uint256 value);

   function emitEvent(uint value) public {
       emit Emitted(msg.sender, value);
   }

   function emitIndexedEvent(address to, uint value) public {
       emit IndexedEvent(msg.sender, to, value);
   }
} 