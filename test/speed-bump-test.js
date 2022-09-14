const { expect } = require('chai');
const { ethers, network} = require('hardhat');
const { LOCAL_NETWORKS } = require('../hardhat.config.js');

LOCAL_NETWORKS.includes(network.name) ? 
describe('SpeedBump', function () {
    beforeEach(async () => {
        signers = await ethers.getSigners();
        user1 = signers[1];
        user2 = signers[2];
        waitingPeriodInDays=9;
        amount = ethers.utils.parseEther('10');
        waitingPeriodInSeconds = waitingPeriodInDays*60*60*24;
        SpeedBump = await ethers.getContractFactory("SpeedBump");
        speedBump = await SpeedBump.deploy(waitingPeriodInSeconds);
        await speedBump.deployed();
    });

    it('Should be able to withdraw after finishing waiting period', async function () {
        speedBump.connect(user1).deposit(amount, {value: amount})
        
        balance = await speedBump.connect(user1).getUserBalance();
        expect(balance).to.equal(amount);

        await expect(speedBump.connect(user1).withdraw(ethers.utils.parseEther('1')))
        .to.emit(speedBump, 'Withdrawl')
        .withArgs(user1.address, ethers.utils.parseEther('1'));

        balance = await speedBump.connect(user1).getUserBalance();
        expect(balance).to.equal(ethers.utils.parseEther('9'));

        await expect(speedBump.connect(user1)
        .withdraw(ethers.utils.parseEther('1')))
        .to.be.revertedWith("Waiting period is not over yet");

        getUserWaitingPeriod = await speedBump.connect(user1).getUserWaitingPeriod();
        
        await network.provider.send("evm_increaseTime", [parseInt(getUserWaitingPeriod)])
        await network.provider.send("evm_mine") 

        await expect(speedBump.connect(user1).withdraw(ethers.utils.parseEther('1')))
        .to.emit(speedBump, 'Withdrawl')
        .withArgs(user1.address, ethers.utils.parseEther('1'));

        balance = await speedBump.connect(user1).getUserBalance();
        expect(balance).to.equal(ethers.utils.parseEther('8'));
    });

    it('Should NOT be able to withdraw during waiting period', async function () {
        speedBump.connect(user1).deposit(amount, {value: amount})
        
        await expect(speedBump.connect(user1).withdraw(ethers.utils.parseEther('1')))
        .to.emit(speedBump, 'Withdrawl')
        .withArgs(user1.address, ethers.utils.parseEther('1'));

        balance = await speedBump.connect(user1).getUserBalance();
        expect(balance).to.equal(ethers.utils.parseEther('9'));

        await expect(speedBump.connect(user1)
        .withdraw(ethers.utils.parseEther('1')))
        .to.be.revertedWith("Waiting period is not over yet");
    });

    it('Should NOT be able to Deposit when amount is not enough', async function () {
        await expect(speedBump.connect(user1)
        .deposit(ethers.utils.parseEther('10'),{value: ethers.utils.parseEther('100')}))
        .to.be.revertedWith("Amount not correct");
    });


    it('Should NOT be able to Withdraw when amount is not enough', async function () {
        await expect(speedBump.connect(user1)
        .withdraw(ethers.utils.parseEther('100'),{value: ethers.utils.parseEther('100')}))
        .to.be.revertedWith("Not enough balance");
    });


   
    it('Should be able to deposit', async function () {
        await expect(speedBump.connect(user1).deposit(amount, {value: amount}))
        .to.emit(speedBump, 'Deposit')
        .withArgs(user1.address, amount);
        balance = await speedBump.connect(user1).getUserBalance();
        expect(balance).to.equal(amount);
    });
}):
describe('SpeedBump Remote', function () {
    //TODO
});