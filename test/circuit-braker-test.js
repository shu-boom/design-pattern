const { expect } = require('chai');
const { ethers, network } = require('hardhat');
const { LOCAL_NETWORKS } = require('../hardhat.config.js');

LOCAL_NETWORKS.includes(network.name) ? 
describe('CircuitBraker', function () {
    beforeEach(async () => {
        signers = await ethers.getSigners();
        owner = signers[0];
        customer = signers[1];
        initialBalance = ethers.utils.parseEther('10');
        CircuitBraker = await ethers.getContractFactory("CircuitBraker", owner);
        circuitBraker = await CircuitBraker.deploy({
          value: initialBalance,
        });
        await circuitBraker.deployed();
    });

    it('should be able to retrieve the balance correctly', async function () {
        balance = await circuitBraker.getBalance()
        expect(balance).to.equal(initialBalance);
    });

    it('should allow anyone to deposit correctly in normal mode', async function () {
        depositAmount = ethers.utils.parseEther('10');
        tx = await circuitBraker.connect(customer).deposit({value: depositAmount})
        balance = await circuitBraker.getBalance()
        totalBalance = BigInt(initialBalance) + BigInt(depositAmount);
        expect(balance).to.equal(totalBalance);
    });

    it('should allow anyone to invoke withdraw correctly in normal mode', async function () {
      withdrawAmount = ethers.utils.parseEther('1');
      balanceBeforeWithdraw = await circuitBraker.getBalance();
      expect(balanceBeforeWithdraw).to.equal(initialBalance);
      tx = await circuitBraker.connect(customer).withdraw(withdrawAmount);
      balanceAfterWithdraw = await circuitBraker.getBalance();
      expectedContractBalance = BigInt(initialBalance) - BigInt(withdrawAmount);
      expect(balanceAfterWithdraw).to.equal(expectedContractBalance);
    });

    it('should NOT allow anyone for invocation of emergency_withdraw in normal mode', async function () {
      await expect(circuitBraker.connect(customer).emergency_withdraw()).to.be.revertedWith('Contract is currently NOT in Emergency');
      await expect(circuitBraker.emergency_withdraw()).to.be.revertedWith('Contract is currently NOT in Emergency');
    });

    it('should allow only owner to toggle emergency', async function () {
      await expect(circuitBraker.connect(customer).toggleEmergency()).to.be.revertedWith('Only Owner Allowed!');
      await circuitBraker.toggleEmergency()
      expect(await circuitBraker.contractStopped()).to.be.true;
    });

    it('should prevent invocation of deposit in emergency mode', async function () {
      depositAmount = ethers.utils.parseEther('10');
      await circuitBraker.toggleEmergency()
      await expect(circuitBraker.connect(customer).deposit({value: depositAmount})).to.be.revertedWith('Contract is currently in Emergency');
      await expect(circuitBraker.deposit({value: depositAmount})).to.be.revertedWith('Contract is currently in Emergency');
    });

    it('should prevent invocation of withdrawl in emergency mode', async function () {
      withdrawAmount = ethers.utils.parseEther('10');
      await circuitBraker.toggleEmergency()
      await expect(circuitBraker.connect(customer).withdraw(withdrawAmount)).to.be.revertedWith('Contract is currently in Emergency');
      await expect(circuitBraker.withdraw(withdrawAmount)).to.be.revertedWith('Contract is currently in Emergency');
    });
  
    it('should only allow owner for invocation of emergency_withdraw in emergency mode', async function () {
      await expect(circuitBraker.emergency_withdraw()).to.be.revertedWith('Contract is currently NOT in Emergency');
      await circuitBraker.toggleEmergency()
      await expect(circuitBraker.connect(customer).emergency_withdraw()).to.be.revertedWith('Only Owner Allowed!');
      await circuitBraker.emergency_withdraw()
      balanceAfterWithdraw = await circuitBraker.getBalance();
      expect(balanceAfterWithdraw).to.equal(ethers.utils.parseEther('0'));
    });
}) : describe('CircuitBraker Remote', function () {
    // TODO
});