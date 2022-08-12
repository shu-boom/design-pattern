const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Secure Transfer", function () {
  it("Attacker should be able to steal ethers from a vulnerable contract", async function () {
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
    await attackerEtherReceiver.deposit({
     value: hre.ethers.utils.parseEther('1'),
   })

    expect(await vulnerableEtherSender.getBalance()).to.equal(hre.ethers.utils.parseEther('0'));
    expect(await attackerEtherReceiver.getBalance()).to.equal(hre.ethers.utils.parseEther('11'));
  });

  it("Attacker should *NOT* be able to steal ethers from a CEI contract", async function () {
      const ChecksEffectsInteractionProtectedEtherSender = await hre.ethers.getContractFactory(
        'ChecksEffectsInteractionProtectedEtherSender',
      )
      const checksEffectsInteractionProtectedEtherSender = await ChecksEffectsInteractionProtectedEtherSender.deploy(
        {value: hre.ethers.utils.parseEther('10')}
      )
      await checksEffectsInteractionProtectedEtherSender.deployed()
   

      const AttackerForChecksEffectsInteractionProtectedEtherSender = await hre.ethers.getContractFactory(
        'AttackerEtherReceiver',
      )
      const attackerForChecksEffectsInteractionProtectedEtherSender = await AttackerForChecksEffectsInteractionProtectedEtherSender.deploy(
        checksEffectsInteractionProtectedEtherSender.address,
      )
      await attackerForChecksEffectsInteractionProtectedEtherSender.deployed()
   
   
    await expect(attackerForChecksEffectsInteractionProtectedEtherSender.deposit({
        value: hre.ethers.utils.parseEther('1'),
      })).to.be.revertedWith('Failed to send Ether');
    expect(await checksEffectsInteractionProtectedEtherSender.getBalance()).to.equal(hre.ethers.utils.parseEther('10'));
  });

  it("Attacker should be able to steal ethers in an unprotected cross-function contract", async function () {
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
      expect(await vulnerableEtherContract.getBalance()).to.equal(hre.ethers.utils.parseEther('4'));
      expect(await crossFunctionAttacker1.getBalance()).to.equal(hre.ethers.utils.parseEther('0'));
      expect(await crossFunctionAttacker2.getBalance()).to.equal(hre.ethers.utils.parseEther('0'));

      await crossFunctionAttacker1.attackInit({value: hre.ethers.utils.parseEther('1')})
      await crossFunctionAttacker2.attackNext()
      await crossFunctionAttacker1.attackNext()
      await crossFunctionAttacker2.attackNext()
      await crossFunctionAttacker1.attackNext()

      expect(await vulnerableEtherContract.getBalance()).to.equal(hre.ethers.utils.parseEther('0'));
      expect(await crossFunctionAttacker1.getBalance()).to.equal(hre.ethers.utils.parseEther('3'));
      expect(await crossFunctionAttacker2.getBalance()).to.equal(hre.ethers.utils.parseEther('2'));
  });

  it("Attacker should *NOT* be able to carry out cross function attack in a reentrant gaurd protected contract", async function () {
    const ReentrantGaurdProtectedContract = await hre.ethers.getContractFactory(
          'ReentrantGaurdProtectedContract',
    );

    const reentrantGaurdProtectedContract = await ReentrantGaurdProtectedContract.deploy({
      value: hre.ethers.utils.parseEther('4'),
    });
    await reentrantGaurdProtectedContract.deployed();
  
    const CrossFunctionAttacker1 = await hre.ethers.getContractFactory(
      'CrossFunctionAttacker',
    );
    const crossFunctionAttacker1 = await CrossFunctionAttacker1.deploy(reentrantGaurdProtectedContract.address);
    await crossFunctionAttacker1.deployed();
  
    const CrossFunctionAttacker2 = await hre.ethers.getContractFactory(
      'CrossFunctionAttacker',
    );
    const crossFunctionAttacker2 = await CrossFunctionAttacker2.deploy(reentrantGaurdProtectedContract.address);
    await crossFunctionAttacker2.deployed();
  
    crossFunctionAttacker1.setAttackPeer(crossFunctionAttacker2.address);
    crossFunctionAttacker2.setAttackPeer(crossFunctionAttacker1.address);
    await expect(crossFunctionAttacker1.attackInit({value: hre.ethers.utils.parseEther('1')})).to.be.revertedWith('Failed to send Ether');
    expect(await reentrantGaurdProtectedContract.getBalance()).to.equal(hre.ethers.utils.parseEther('4'));
    expect(await crossFunctionAttacker1.getBalance()).to.equal(hre.ethers.utils.parseEther('0'));
    expect(await crossFunctionAttacker2.getBalance()).to.equal(hre.ethers.utils.parseEther('0')); 
});

});
