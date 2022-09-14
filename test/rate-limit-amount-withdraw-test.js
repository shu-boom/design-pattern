const { expect } = require('chai');
const { ethers, network } = require('hardhat');
const { LOCAL_NETWORKS } = require('../hardhat.config.js');

LOCAL_NETWORKS.includes(network.name) ? 
describe('RateLimitAmountBeingWithdrawn', function () {
    beforeEach(async () => {
        signers = await ethers.getSigners();
        userAddress = signers[0].address;
        period = 256;
        maximum_limit = ethers.utils.parseEther('10');
        RateLimitAmountBeingWithdrawn = await ethers.getContractFactory("RateLimitAmountBeingWithdrawn");
        rateLimitAmountBeingWithdrawn = await RateLimitAmountBeingWithdrawn.deploy(period, maximum_limit, {value: ethers.utils.parseEther('100')});
        await rateLimitAmountBeingWithdrawn.deployed();
    });

    it('Should be able retrieve amount upto maximum limit during the expiration time', async function () {
        rateLimitAmountBeingWithdrawn.withdraw(ethers.utils.parseEther('10'), {value: ethers.utils.parseEther('10')});
        await expect(rateLimitAmountBeingWithdrawn.withdraw(ethers.utils.parseEther('1'), {value: ethers.utils.parseEther('1')})).to.be.revertedWith('Overflown');
    });


    it('Should be able to reset the amount limit once the expiration time has passed', async function () {
        rateLimitAmountBeingWithdrawn.withdraw(ethers.utils.parseEther('10'), {value: ethers.utils.parseEther('10')});
        await expect(rateLimitAmountBeingWithdrawn.withdraw(ethers.utils.parseEther('1'), {value: ethers.utils.parseEther('1')})).to.be.revertedWith('Overflown');
        await hre.network.provider.send("hardhat_mine", ["0x101"]); // forwards 257 blocks and limit resets 
        rateLimitAmountBeingWithdrawn.withdraw(ethers.utils.parseEther('10'), {value: ethers.utils.parseEther('10')});
    });

})
:
describe('RateLimitAmountBeingWithdrawn Remote', function () {
    //TODO
});
