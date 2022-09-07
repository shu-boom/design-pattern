const { expect, assert } = require('chai');
const { ethers, network } = require('hardhat')
const {networks} = require("../hardhat.config.js");
console.log(networks);
console.log(network);
const LinkTokenABI = require("@chainlink/contracts/abi/v0.4/LinkToken.json"); 

/**
 * These can be simplified using fixtures. The following are mocks and good for local testing.
 * 
 * We can use chainID to decide on the environment and mocks would get deploy for local
 * Otherwise, we can use our .env to get us correct data if we are on a network.
 */

["hardhat", "localhost"].includes(network.name) ? 
 describe('Oracle Tests Local', function () {
  beforeEach(async () => {
      // Deploy Mocks and wait use those to setup oracle
      BASE_FEE = "100000000000000000"
      GAS_PRICE_LINK = "1000000000" 
      KEY_HASH = "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15";
      signers = await ethers.getSigners();
      
      LinkTokenMock = await ethers.getContractFactory("LinkToken");
      linkTokenMock = await LinkTokenMock.deploy();
      await linkTokenMock.deployed();

      VRFCoordinatorV2MockFactory = await ethers.getContractFactory("VRFCoordinatorV2MockCustom");
      vrfCoordinatorMock = await VRFCoordinatorV2MockFactory.deploy(
          BASE_FEE, GAS_PRICE_LINK
      )
      await vrfCoordinatorMock.deployed();

      Oracle = await ethers.getContractFactory("Oracle");
      oracle = await Oracle.deploy(vrfCoordinatorMock.address, KEY_HASH, linkTokenMock.address, {gasLimit: 8000000});
      await oracle.deployed();

      console.log("Oracle deployed to:", oracle.address);
      subscriptionId = await oracle.subscriptionId();
      await vrfCoordinatorMock.fundSubscription(subscriptionId, ethers.utils.parseEther("5"));
  });

  it("Should successfully request a random number", async () => {
      await expect(oracle.requestRandomWords(2)).to.emit(
        vrfCoordinatorMock,
        "RandomWordsRequested"
      )
  })

  it("Should successfully request a random number and get a result", async () => {
      await oracle.requestRandomWords(2)
      const requestId = await oracle.requestId();
      // simulate callback from the oracle network
      await expect(
          vrfCoordinatorMock.fulfillRandomWords(requestId, oracle.address)
      ).to.emit(oracle, "FullfillRandomness")

      const firstRandomNumber = await oracle.randomNumbers(0)
      const secondRandomNumber = await oracle.randomNumbers(1)

      assert(
        firstRandomNumber.gt(ethers.constants.Zero),
        "First random number is greather than zero"
      )

      assert(
        secondRandomNumber.gt(ethers.constants.Zero),
        "Second random number is greather than zero"
      )
  })

  it("Should successfully fire event on callback", async function () {
      await new Promise(async (resolve, reject) => {
        oracle.once("FullfillRandomness", async () => {
          console.log("FullfillRandomness event fired!")
          const firstRandomNumber = await oracle.randomNumbers(0);
          const secondRandomNumber = await oracle.randomNumbers(1);
          // assert throws an error if it fails, so we need to wrap
          // it in a try/catch so that the promise returns event
          // if it fails.
          try {
            assert(firstRandomNumber.gt(ethers.constants.Zero));
            assert(secondRandomNumber.gt(ethers.constants.Zero));
            resolve();
          } catch (e) {
            reject(e);
          }
        })
        await oracle.requestRandomWords(2)
        const requestId = await oracle.requestId()
        vrfCoordinatorMock.fulfillRandomWords(requestId, oracle.address)
      })
  })
 }) 
 
 :
 
 describe('Oracle Tests Remote', function () {
  beforeEach(async () => {
      // Deploy Mocks and wait use those to setup oracle
      // pull all the required dependencies from the network config. 
      config = networks[network.name];
      
      hasDependenciesDefined = config.hasOwnProperty('vrfCoordinator') 
                            && config.hasOwnProperty('keyhash') 
                            && config.hasOwnProperty('linkToken');
      
      VRFCoordinator = config["VRFCoordinator"]
      KeyHash = config["KeyHash"]
      LinkToken = config["LinkToken"]
      signers = await ethers.getSigners();
      Oracle = await ethers.getContractFactory("Oracle");
      oracle = await Oracle.deploy(VRFCoordinator, KeyHash, LinkToken);
      await oracle.deployed();

      console.log("Oracle deployed to:", oracle.address);
      subscriptionId = await oracle.subscriptionId();
     
      let linkContract = new ethers.Contract(LinkToken, LinkTokenABI);
      console.log("Transferring tokens to Oracle, so it can provide link tokens to the subscription id")
      // transferred link to the oracle address
      await linkContract.connect(signers[0]).transfer(oracle.address, hre.ethers.utils.parseEther('4'));
      this.timeout(300000) // wait 300 seconds max
      await oracle.topUpSubscription(hre.ethers.utils.parseEther('4'));
      this.timeout(300000) // wait 300 seconds max
  });

  afterEach(async function () {
    oracle.removeAllListeners()
  })

  it("Should successfully fire event on callback", async function () {
      await new Promise(async (resolve, reject) => {
        oracle.once("FullfillRandomness", async () => {
          console.log("FullfillRandomness event fired!")
          const firstRandomNumber = await oracle.randomNumbers(0);
          const secondRandomNumber = await oracle.randomNumbers(1);
          // assert throws an error if it fails, so we need to wrap
          // it in a try/catch so that the promise returns event
          // if it fails.
          try {
            assert(firstRandomNumber.gt(ethers.constants.Zero));
            assert(secondRandomNumber.gt(ethers.constants.Zero));
            resolve();
          } catch (e) {
            reject(e);
          }
        })
        await oracle.requestRandomWords(2);
      })
  })
})

