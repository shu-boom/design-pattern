const hre = require("hardhat");

async function main() {
  const signers = await hre.ethers.getSigners();
  const owner = signers[0];
  const customer = signers[1];

  const CircuitBraker = await hre.ethers.getContractFactory("CircuitBraker", owner);
  const circuitBraker = await CircuitBraker.deploy({
    value: hre.ethers.utils.parseEther('10'),
  });
  await circuitBraker.deployed();
  console.log("Circuit Braker deployed to:", circuitBraker.address);
  console.log(await circuitBraker.getBalance())
  await circuitBraker.connect(customer).withdraw(hre.ethers.utils.parseEther('5'));
  console.log(await circuitBraker.getBalance())
  await circuitBraker.toggleEmergency();
  await circuitBraker.emergency_withdraw();
  console.log(await circuitBraker.getBalance())
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
