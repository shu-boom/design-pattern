require("@nomiclabs/hardhat-waffle");
require("solidity-coverage");
require("@nomiclabs/hardhat-ethers");
require("dotenv").config();
// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html

const privateKey = process.env.PRIVATE_KEY;
const URL = process.env.URL;
const LOCAL_NETWORKS = ["hardhat", "localhost"];
 
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    hardhat: {
      chainId: 1337,
      gas: 8000000,
      gasPrice: 50 * 1000000000
    },
    goerli: {
      url: URL,
      accounts: [privateKey],
      gas: 8000000,
      gasPrice: 50 * 1000000000, 
      VRFCoordinator: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D",
      KeyHash: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
      LinkToken: "0x326C977E6efc84E512bB9C30f76E30c160eD06FB"
    }
  },
  solidity:{
    solc: {
        version: "pragma"
    },
    compilers: [
      {
        version: "0.8.0",
      },
      {
        version: "0.8.4",
        settings: {},
      },
      {
        version: "0.4.26",
      },
      {
        version: "0.4.11",
      }
    ]
  },
  mocha: {
    timeout: 40000000
  },
  LOCAL_NETWORKS: ["hardhat", "localhost"]
};
