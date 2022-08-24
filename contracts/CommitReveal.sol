//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
/**
    In this pattern, a user commits an encrypted hash in place of a choice. This is to make sure that user's choice is not revealed before a vote has been casted. 
    The user is able to reveal their choice at a later time and prove that the choice they are mentioning was indeed the choice that they committed earlier. 

    This feature is facilitated by the hashing capabilities of the solidity language. 

    Essentially, the user commits a hash in the beginning. The hash is created offchain by combining a choice and a secret, which is unique to the user. 
    When its time for user to reveal their choice, they are able to provide the choice and the secret that they used to generate the commit hash. 
    Given a secret and the choice, the contract confirms if the user indeed committed to the given choice. 

    Use Cases: 
        Although there are many use cases for such commit-reveal feature, the most prominient use case is unbaised voting contracts. 
        Smart contracts and transactions are transparent and verifiable on chain. 
        Therefore, public voting contracts may easily expose voters' choices and influence the election outcome.

        Using this approach, a voter hash their choice with a personalized secret and submit the hash as their vote.
        Once the voting period is expired, users are requested to reveal their choices. 
        Finally, when the revelation period is finished, the election administrator counts the revealed votes and announce the result. 

        This is a simple example of how an unbiased voting contract could behave with commit and reveal design pattern. 

    For the sake of simplicity, the following contract simply allows users to commit a choice and later reveal it. 
 */
contract CommitReveal {
    enum Status {
        NotSubmitted,
        Commited,
        Revealed
    }

    struct Choice {
        string choice;
        string secret;
        Status status;
        bytes32 hash;
    }

    mapping(address=>Choice) public userChoices;
    // The following could be used to support multiple commits. 
    // mapping(address => mapping(bytes32 => Commit)) public userCommits;

    event Committed(address _user, bytes32 _hash);
    event Revealed(address _user, bytes32 _hash, string _choice, string _secret);
    event RevealedDetails(bytes32 _hash, string _choice, string _secret);
    /**
        Context : The user provides a hash which is used to create a choice.
                  A choice must not exist before hand for this user. 
                  Therefore, a user can only have a single choice. 
        Constraint :
            If user has already commited return 
            If user's choice is already revealed return
    */
    function commit(bytes32 _hash) public {
        if(userChoices[msg.sender].status == Status.Commited){
             revert("Choice is already committed");
        }
        if(userChoices[msg.sender].status == Status.Revealed){
             revert("Choice already revealed");
        }
        // should trigger emergency when happens for the first time. I think at this point the logic is failed
        require(userChoices[msg.sender].status == Status.NotSubmitted, "Something may be wrong.");
        userChoices[msg.sender].status = Status.Commited;
        userChoices[msg.sender].hash = _hash;
        emit Committed(msg.sender, _hash);
    }

    /**
        Context 
            User has a committed choice and now they are planning to reveal the choice 
        Constraints
            If user does not have a commited choice return
            If the choice is already revealed returned 
            If the keccak of choice and secret do not match the provided hash return
    */
    function reveal(string memory _choice, string memory _secret) public {
        if(userChoices[msg.sender].status == Status.NotSubmitted){
             revert("Choice is Not Submitted");
        }
        if(userChoices[msg.sender].status == Status.Revealed){
             revert("Choice already revealed");
        }
        require(userChoices[msg.sender].status == Status.Commited, "Something may be wrong");
        require(userChoices[msg.sender].hash == keccak256(abi.encodePacked(_choice, _secret)), "Choice and secret do not match the provided hash");
        userChoices[msg.sender].status = Status.Revealed;
        userChoices[msg.sender].choice = _choice;
        userChoices[msg.sender].secret = _secret;
        emit Revealed(msg.sender, userChoices[msg.sender].hash, _choice, _secret);
    }

    /**
        Context
            User has a revealed choice and we would like to check the details of the choice
        Constraints
            If the choice is not revealed return
    */
    function getRevealedChoiceDetails() external view returns(string memory, string memory, bytes32){
        require(userChoices[msg.sender].status == Status.Revealed, "Choice not yet revealed");
        return(userChoices[msg.sender].choice, userChoices[msg.sender].secret, userChoices[msg.sender].hash);
    }
}

// https://gist.github.com/karlfloersch/0ba69290f5d18823548dc32fe1f6a250