const hre = require("hardhat");

async function main() {
  const CommitReveal = await hre.ethers.getContractFactory("CommitReveal");
  const commitReveal = await CommitReveal.deploy();
  await commitReveal.deployed();

  console.log("Commit Reveal deployed to:", commitReveal.address);
  await commitReveal.commit(getHash("choice1", "user1"))
  await commitReveal.reveal("choice1", "user1");

  const tx = await commitReveal.getRevealedChoiceDetails();
  const txReceipt = await tx.wait();

  const [_hash, _choice, _secret] = txReceipt.events.find(x=>x.event=="RevealedDetails").args;
  console.log("Revealed _hash", _hash);
  console.log("Revealed _choice", _choice);
  console.log("Revealed _secret", _secret);
}

function getHash(_choice, _secret){
    return hre.ethers.utils.solidityKeccak256(["string", "string"], [_choice, _secret]);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
