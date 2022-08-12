//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
/**
    State Machine Pattern:

    Smart contract like auction, gambling, crowd-funding contract often go thru many states during their lifecycle. 
    These contracts behave differently at different stages.

    Stages can be implemented with Enums in Solidity. Enums are user defined data structures that can store all possible stages. 
    An instance of the stage is used to keep track of the latest stage 

    Depending upon the use-case, state checks generally done during the beginning of the function and state transition generally happened towards the end of the function. 
    Modifiers are great functions to handle similar checks througout the contracts. 
    Moreover, state tranitions can happen manually by calling functions. or by some time contraints. 

    EXAMPLE: 
        This state machine maintains 3 different stages of an NFT Auction (Start, Bidding, Sold)
        Stages
            Start: Only owner can start the bidding
            Bidding: Accepts blind bids from other users
            Sold: Current owner transfers the ownership 
        Manual Transition : Using function call 
        Timed Transition : After 8 days from the start

    Modifiers are executed in the order they are mentioned. The time based transition take priority before the checking modifier. Finally, there would be a state transition modifier 
    The state transition modifier would transition the current stage to the other stage.
 */
contract StateMachine {
    enum States {
        BallotCreated,
        CurrentlyAcceptingVotes,
        ResultsAnnounced
    }

    address owner;
    uint256 autoCloseVotingTime;
    States public state;

    constructor(){
        state = States.BallotCreated;
        owner = msg.sender;
    }
    
    modifier checkAutoCloseVotingTime() {
        if(state == States.CurrentlyAcceptingVotes && block.timestamp >= autoCloseVotingTime){
            changeStates(States.ResultsAnnounced);
        }
        _;
    }

    modifier checkState(States _state){
        require(state == _state, "States do not match");
        _;
    }

    modifier transitionState(States _state) {
        _;
        changeStates(_state);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only Owner");
        _;
    }

    function changeStates(States _state) internal {
       state = _state;
    }

    function nextState() internal {
       state = States(uint(state) + 1);
    }
    // When this contract is created this is the only method that is allowed. Calling this method would start the voting
    function votingStart(uint256 time) public onlyOwner checkState(States.BallotCreated) transitionState(States.CurrentlyAcceptingVotes) returns(string memory) {
        autoCloseVotingTime = block.timestamp + (time * 1 days);
        console.log("Voting Has Started and would close in 8 days");
        return "Voting Has Started and would close automatically in the time provided";
    }
    // the voting closes automatically after the given time and changes states. 
    function voting() public checkAutoCloseVotingTime checkState(States.CurrentlyAcceptingVotes) returns(string memory){
        return "Voting is currently going on";
    }
    // this function allows the results to be calculated. 
    function announceResults() public onlyOwner checkAutoCloseVotingTime checkState(States.ResultsAnnounced) {
        console.log("Announcing Results");
    }
}
