const { expect } = require('chai');
const { ethers, network } = require('hardhat');
const { LOCAL_NETWORKS } = require('../hardhat.config.js');

LOCAL_NETWORKS.includes(network.name) ? 
describe('CommitReveal', function () {
    beforeEach(async () => {
        signers = await ethers.getSigners();
        userAddress = signers[0].address;
        CommitReveal = await ethers.getContractFactory("CommitReveal");
        commitReveal = await CommitReveal.deploy();
        await commitReveal.deployed();
        _choice = "I AM AWESOME"
        _secret = "Secret"
        _hash = ethers.utils.solidityKeccak256(["string", "string"], [_choice, _secret]);
        Status = {
            NotSubmitted: 0,
            Commited: 1,
            Revealed: 2
        }
    });

    it('should be able to commit if a choice is not submitted', async function () {
        var { status } = await commitReveal.userChoices(userAddress);
        expect(status).to.equal(Status.NotSubmitted)
        await expect(commitReveal.commit(_hash))
        .to.emit(commitReveal, 'Committed')
        .withArgs(userAddress, _hash);
        var { status } = await commitReveal.userChoices(userAddress);
        expect(status).to.equal(Status.Commited)
    });

    it('should NOT be able to commit if a choice is already revealed', async function () {
        await commitReveal.commit(_hash);
        await commitReveal.reveal(_choice, _secret);
        await expect(commitReveal.commit(_hash)).to.be.revertedWith('Choice already revealed');
    });

    it('should NOT be able to commit if a choice is already committed', async function () {
        await commitReveal.commit(_hash);
        await expect(commitReveal.commit(_hash)).to.be.revertedWith('Choice is already committed');
    });

    it('should be able to reveal if a choice is committed', async function () {
        await commitReveal.commit(_hash);
        await expect(commitReveal.reveal(_choice, _secret))
        .to.emit(commitReveal, 'Revealed')
        .withArgs(userAddress, _hash, _choice, _secret);
    });

    it('should NOT be able to reveal if a choice is not submitted', async function () {
        await expect(commitReveal.reveal(_choice, _secret)).to.be.revertedWith('Choice is Not Submitted');
    });

    it('should NOT be able to reveal if a choice is already revealed', async function () {
        await commitReveal.commit(_hash);
        await commitReveal.reveal(_choice, _secret);
        await expect(commitReveal.reveal(_choice, _secret)).to.be.revertedWith('Choice already revealed');
    });

    it('should ONLY be able to reveal choice details if the choice is revealed', async function () {
        await expect(commitReveal.getRevealedChoiceDetails()).to.be.revertedWith('Choice not yet revealed');
        await commitReveal.commit(_hash);
        await expect(commitReveal.getRevealedChoiceDetails()).to.be.revertedWith('Choice not yet revealed');
        await commitReveal.reveal(_choice, _secret);
        [choice, secret, hash] = await commitReveal.getRevealedChoiceDetails();
        expect(choice).to.equal(_choice)
        expect(secret).to.equal(_secret)
        expect(hash).to.equal(_hash)
    });
}) : 
describe('CommitReveal Remote', function () {
    //TODO
});