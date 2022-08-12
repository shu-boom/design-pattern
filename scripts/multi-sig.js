const hre = require("hardhat");

async function main() {
  const signers = await hre.ethers.getSigners();
  const owner = signers[0];
  
  const validator2 = signers[1];
  const validator3 = signers[2];
  const validator4 = signers[3];

  const from = signers[4];
  const to = signers[5];

  const MultiSig = await hre.ethers.getContractFactory("MultiSig", owner);
  const multiSig = await MultiSig.deploy();
  await multiSig.deployed();

  console.log("Multi Sig deployed to:", multiSig.address);  
  console.log("validator2 deployed to:", validator2.address);  

  await multiSig.addValidator(validator2.address);  
  await multiSig.addValidator(validator3.address);  
  await multiSig.addValidator(validator4.address);  
  await multiSig.connect(from).transfer(to.address, hre.ethers.utils.parseEther("1") ,{value: hre.ethers.utils.parseEther("1")});  
  
  console.log("Completed transfer and about to get Transaction details: ");  

  var resp = await multiSig.getTransactionDetails(0);

  console.log ("Transaction details",
    resp
  );

  console.log ("Total Transactions ", await multiSig.totalTransactions());

  var pendingTransactions = await multiSig.getAllPendingTransactions();

  console.log(
    "PendingTransactions:",
    pendingTransactions
  );

  var confirmTransaction = await multiSig.confirmTransaction(0);

  var { 
    recepient,
    sender,
    executed,
    amount,
    numOfConfirmations
 } = await multiSig.getTransactionDetails(0);

 console.log("Transaction details AFTER 1 confirmation:",
   recepient,
   sender,
   executed,
   amount,
   numOfConfirmations
 );

 var pendingTransactions = await  multiSig.getAllPendingTransactions();

 console.log(
   "PendingTransactions AFTER 1 confirmation:",
   pendingTransactions
 );

 var confirmTransaction = await multiSig.connect(validator2).confirmTransaction(0);

  var { 
    recepient,
    sender,
    executed,
    amount,
    numOfConfirmations
 } = await multiSig.getTransactionDetails(0);

 console.log("Transaction details AFTER 2 confirmation",
   recepient,
   sender,
   executed,
   amount,
   numOfConfirmations
 );

 var pendingTransactions = await  multiSig.getAllPendingTransactions();

 console.log(
   "PendingTransactions AFTER 2 confirmation:",
   pendingTransactions
 );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
