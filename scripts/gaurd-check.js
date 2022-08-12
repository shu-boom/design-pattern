const hre = require("hardhat");

async function main() {
  const GuardCheck = await hre.ethers.getContractFactory("GuardCheck");
  const guardCheck = await GuardCheck.deploy();

  await guardCheck.deployed();

  console.log("Gaurd Check deployed to:", guardCheck.address);

  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
