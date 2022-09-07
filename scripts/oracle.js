const hre = require("hardhat");
// Had to download this because getContractAt is not working for me. Moreover, events arent define in the LinkTokenInterface
const LinkTokenABI = require("@chainlink/contracts/abi/v0.4/LinkToken.json"); 

/**
 * There are three ways to pull contract. Either we use getContractAt : This is giving me issues
 * The other way is to import the contract or download the ABI.
 */
//  https://docs.chain.link/docs/vrf/v2/security/
async function main() {
    
    /**
     * With step by step programmatic subscription 
     * 
     * First we deploy an oracle contract. Using the helper function, we got a subscriptionId for this oracle 
     * This subscription id which contains the newly generated oracle contract needs to be funded with link token
     * LinkToken contract is used to transfer some link from user to oracle address.
     * 
     * We can either fund the id ourselves using the application or we can directly call transferAndCall function using our account 
     * Example.  https://github.com/smartcontractkit/chainlink-mix/blob/main/scripts/vrf_scripts/create_subscription.py#L45
     * 
     * We can also use the oracle if we want to topup before each request. 
     * In this case, orackle would internally call the transferAndCall of linkToken. This would make msg.sender the oracle. 
     * Therefore, if we choose to move this route we need to fund the oracle address with Link token. This can be achived by watching events as described below
     * 
     */
    const Oracle = await hre.ethers.getContractFactory("Oracle");
    const _vrfCoordinator = "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D";
    const _keyhash = "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15";
    const _linkToken = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB";

    const accounts = await hre.ethers.getSigners();
    const signer = accounts[0];

    const oracle = await Oracle.deploy(_vrfCoordinator, _keyhash, _linkToken);
    await oracle.deployed();
    console.log("Oracle deployed to:", oracle.address);
    var subscriptionId = await oracle.subscriptionId();
    console.log("Got the subscriptiton Id : ", subscriptionId);
    // Since use used this contract inside the our oracle contract. We already have the ABI  
    let linkContract = new hre.ethers.Contract(_linkToken, LinkTokenABI);
    console.log("Transferring tokens to Oracle, so it can provide link tokens to the subscription id")
    // transferred link to the oracle address
    await linkContract.connect(signer).transfer(oracle.address, hre.ethers.utils.parseEther('5'));
    // Create an event filter that triggers when the contract is able to transfer 
    // The funds from signer to oracle address 
    // Watching the trasfer event to continue further task. 

    // There were two Transfer events so using this filter to explicitly define 
    TransferFilter = {
      address: linkContract.address,
      topics: [
          ethers.utils.id("Transfer(address,address,uint256)"),
          ethers.utils.hexZeroPad(signer.address, 32),
          ethers.utils.hexZeroPad(oracle.address, 32)
      ]
    }
    
    linkContract.connect(signer).once(TransferFilter, async () => {
      // Now that oracle has a balance
      console.log("About to top up subscription");
      await oracle.topUpSubscription(hre.ethers.utils.parseEther('5'));
    })

    let TopUpSubscriptionFilter = oracle.filters.TopUpSubscription(subscriptionId, oracle.address);
    // We further watch when topUp is complete so we can request random words from the newly funded subscription id 
    oracle.once(TopUpSubscriptionFilter, async () => {
      // At this point call requestRandomWords
      console.log("About to request Random Words");
      await oracle.requestRandomWords(2);
    })

    // Once we have requested randomWords. It would take a while for us to receive the result. 
    // My approach is to watch the event for FullfillRandomness and handle the results. 
    oracle.once("FullfillRandomness", async () => {
      console.log("FullfillRandomness event fired!")
      const firstRandomNumber = await oracle.randomNumbers(0)
      const secondRandomNumber = await oracle.randomNumbers(1)
      console.log(
        `Random Numbers are: ${firstRandomNumber.toString()} and ${secondRandomNumber.toString()}`
      );
    })
}

main()