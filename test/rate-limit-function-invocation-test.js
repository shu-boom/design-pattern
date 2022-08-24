const { expect } = require('chai');
const { ethers } = require('hardhat')

describe('RateLimitFunctionInvocation', function () {
    beforeEach(async () => {
        signers = await ethers.getSigners();
        userAddress = signers[0].address;
        RateLimitFunctionInvocation = await ethers.getContractFactory("RateLimitFunctionInvocation");
        rateLimitFunctionInvocation = await RateLimitFunctionInvocation.deploy({value: ethers.utils.parseEther('100')});
        await rateLimitFunctionInvocation.deployed();
    });

    it('Should be able invoke function once during expiration time', async function () {
        await ethers.provider.send('evm_increaseTime', [5*60]); // forwards by 5 mins
        await ethers.provider.send('evm_mine');
        await rateLimitFunctionInvocation.withdraw(ethers.utils.parseEther('10'), {value: ethers.utils.parseEther('10')});
        await expect(rateLimitFunctionInvocation.withdraw(ethers.utils.parseEther('10'), {value: ethers.utils.parseEther('10')})).to.be.revertedWith('try after 5 minutes');    
    });


    it('Should be able reset limit after the limit expiration time', async function () {
        await ethers.provider.send('evm_increaseTime', [5*60]); // forwards by 5 mins
        await ethers.provider.send('evm_mine');
        await rateLimitFunctionInvocation.withdraw(ethers.utils.parseEther('10'), {value: ethers.utils.parseEther('10')});
        await expect(rateLimitFunctionInvocation.withdraw(ethers.utils.parseEther('10'), {value: ethers.utils.parseEther('10')})).to.be.revertedWith('try after 5 minutes');    
        await ethers.provider.send('evm_increaseTime', [5*60]); // forwards by 5 mins
        await ethers.provider.send('evm_mine');
        await rateLimitFunctionInvocation.withdraw(ethers.utils.parseEther('10'), {value: ethers.utils.parseEther('10')});
    });
});