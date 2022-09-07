//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

// This is just a demonstration of how random numbers can be obtained using chainlink VRF. 
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";

contract Oracle is VRFConsumerBaseV2 {
   uint[] public randomNumbers;
   uint public requestId;
   uint64 public subscriptionId;
   bytes32 keyHash;
   LinkTokenInterface linkToken;
   VRFCoordinatorV2Interface coordinator;
   uint32 callbackGasLimit = 100000;
   uint16 requestConfirmations = 3;
   event RequestedRandomness(uint, uint64, uint32);
   event FullfillRandomness(uint, uint[]);
   event TopUpSubscription(uint64 indexed, address indexed, uint);
   address owner;

   constructor(address _vrfCoordinator, bytes32 _keyhash, address _linkToken) VRFConsumerBaseV2(_vrfCoordinator) {
       keyHash = _keyhash;
       linkToken = LinkTokenInterface(_linkToken);
       coordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
       owner = msg.sender;
       createNewSubscription();
   }

   function getRandomNumbers() public view returns(uint[] memory) {
       return randomNumbers;
   }

   function requestRandomWords(
    uint32 numWords
   ) external {
    requestId = coordinator.requestRandomWords(
      keyHash,
      subscriptionId,
      requestConfirmations,
      callbackGasLimit,
      numWords
    );
    emit RequestedRandomness(requestId, subscriptionId, numWords);
   }

   function fulfillRandomWords(uint256 _requestId, uint256[] memory randomWords) override internal {
    require(requestId == _requestId, "Incorrect request id");
    randomNumbers = randomWords;
    emit FullfillRandomness(_requestId, randomWords);
   }

    // Create a new subscription when the contract is initially deployed.
   function createNewSubscription() private onlyOwner {
      subscriptionId = coordinator.createSubscription();
      coordinator.addConsumer(subscriptionId, address(this));
   }

    // 1000000000000000000 = 1 LINK
   function topUpSubscription(uint256 amount) external onlyOwner {
      linkToken.transferAndCall(address(coordinator), amount, abi.encode(subscriptionId));
      emit TopUpSubscription(subscriptionId, address(this), amount);
   }

   function addConsumer(address consumerAddress) external onlyOwner {
    // Add a consumer contract to the subscription.
     coordinator.addConsumer(subscriptionId, consumerAddress);
   }

   function removeConsumer(address consumerAddress) external onlyOwner {
    // Remove a consumer contract from the subscription.
     coordinator.removeConsumer(subscriptionId, consumerAddress);
   }

   function cancelSubscription(address receivingWallet) external onlyOwner {
    // Cancel the subscription and send the remaining LINK to a wallet address.
     coordinator.cancelSubscription(subscriptionId, receivingWallet);
     subscriptionId = 0;
   }

   function withdraw(uint256 amount, address to) external onlyOwner {
     linkToken.transfer(to, amount);
   }

   modifier onlyOwner() {
     require(msg.sender == owner);
     _;
   }
} 