const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('MultiSig', function () {
    beforeEach(async () => {
        signers = await hre.ethers.getSigners();
        owner = signers[0];

        ZERO = "0x0000000000000000000000000000000000000000"
        validator2 = signers[1];
        validator3 = signers[2];
        validator4 = signers[3];

        from = signers[4];
        to = signers[5];

        from2 = signers[4];
        to2 = signers[5];

        MultiSig = await hre.ethers.getContractFactory("MultiSig", owner);
        multiSig = await MultiSig.deploy();
        await multiSig.deployed();
    });

    it('Should only allow owner to add the validator ONCE', async function () {
        // Only owner can add validator
        var tx = await multiSig.addValidator(validator2.address);
        var receipt = await tx.wait();
        const event = receipt.events.find(event => event.event === 'ValidatorAdded');
        const [_validator] = event.args;
        expect(_validator).to.equal(validator2.address);
        expect(await multiSig.isValidator(validator2.address)).to.be.true;
        await expect(multiSig.connect(validator2).addValidator(validator3.address)).to.be.revertedWith('Only Owner Allowed!');
        await expect(multiSig.addValidator(validator2.address)).to.be.revertedWith('Validator already added');
        await expect(multiSig.addValidator(ZERO)).to.be.revertedWith('Validator cant be zero address');

    });

    
    it('Should tell if the given address is a validator or NOT', async function () {
        await multiSig.addValidator(validator2.address);
        expect(await multiSig.isValidator(validator2.address)).to.be.true;
        expect(await multiSig.isValidator(owner.address)).to.be.true;
        expect(await multiSig.isValidator(validator3.address)).to.be.false;
        expect(await multiSig.isValidator(ZERO)).to.be.false;
    });
  
    it('Should give transaction details when transaction exists', async function () {
        var txTransfer = await multiSig.connect(from).transfer(to.address, ethers.utils.parseEther("1") ,{value: ethers.utils.parseEther("1")});  
        expect(await multiSig.getBalance()).to.equal(ethers.utils.parseEther("1"));
        var receipt = await txTransfer.wait();
        const event = receipt.events.find(event => event.event === 'TransactionCreated');
        const [_from, _to, _amount, _uid] = event.args;

        var { 
            recepient,
            sender,
            executed,
            amount,
            numOfConfirmations
         } = await multiSig.getTransactionDetails(_uid);

         expect(recepient).to.equal(to.address);
         expect(sender).to.equal(from.address);
         expect(executed).to.be.false;
         expect(amount).to.equal(ethers.utils.parseEther("1"));
         expect(numOfConfirmations).to.equal(0);
    });

    it('Should THROW ERROR when transaction does not exists', async function () {
       var transactionDoesNotExistsForThisId = 0;
       await expect(multiSig.getTransactionDetails(transactionDoesNotExistsForThisId)).to.be.revertedWith('Transaction does not exists');
    });

    it('Should ONLY allow validator to get all the pending transactions', async function () {
       await expect(multiSig.connect(from).getAllPendingTransactions()).to.be.revertedWith('Only Validator Allowed!');
    });

    it('Should return all the pending transactions', async function () {
       var array = await multiSig.getAllPendingTransactions();
       expect(array).to.be.an("array").that.is.empty;
       await multiSig.connect(from).transfer(to.address, ethers.utils.parseEther("1") ,{value: ethers.utils.parseEther("1")});  
       var array2 = await multiSig.getAllPendingTransactions();
       expect(array2.length).to.equal(1);
       await multiSig.connect(from2).transfer(to2.address, ethers.utils.parseEther("1") ,{value: ethers.utils.parseEther("1")});  
       var array3 = await multiSig.getAllPendingTransactions();
       expect(array3.length).to.equal(2);
    });

    it('Should change pending transactions list as confirmation and execution happens', async function () {
        await multiSig.addValidator(validator2.address);
        var pendingTransactions = await multiSig.getAllPendingTransactions();
        expect(pendingTransactions).to.be.an("array").that.is.empty;
        var tx1 = await multiSig.connect(from).transfer(to.address, ethers.utils.parseEther("1") ,{value: ethers.utils.parseEther("1")});  
        var tx2 = await multiSig.connect(from2).transfer(to2.address, ethers.utils.parseEther("1") ,{value: ethers.utils.parseEther("1")});  
        
        var receipt1 = await tx1.wait();
        const event1 = receipt1.events.find(event => event.event === 'TransactionCreated');
        const [,,,_uid1] = event1.args;

        var receipt2 = await tx2.wait();
        const event2 = receipt2.events.find(event => event.event === 'TransactionCreated');
        const [, , , _uid2] = event2.args;

        pendingTransactions = await multiSig.getAllPendingTransactions();
        expect(pendingTransactions.length).to.equal(2);

        await multiSig.confirmTransaction(_uid1);

        pendingTransactions = await multiSig.getAllPendingTransactions();
        expect(pendingTransactions.length).to.equal(2);

        await multiSig.connect(validator2).confirmTransaction(_uid1);
        pendingTransactions = await multiSig.getAllPendingTransactions();
        expect(pendingTransactions.length).to.equal(1);

        await multiSig.confirmTransaction(_uid2);

        var tx3 = await multiSig.connect(from).transfer(to.address, ethers.utils.parseEther("1") ,{value: ethers.utils.parseEther("1")});  
        var receipt3 = await tx3.wait();
        const event3 = receipt3.events.find(event => event.event === 'TransactionCreated');
        const [,,,_uid3] = event3.args;

        pendingTransactions = await multiSig.getAllPendingTransactions();
        expect(pendingTransactions.length).to.equal(2);

        await multiSig.connect(validator2).confirmTransaction(_uid2);
        pendingTransactions = await multiSig.getAllPendingTransactions();
        expect(pendingTransactions.length).to.equal(1);
    });

    it('Should allow anyone to create a transaction ', async function () {
        var tx1 = await multiSig.connect(from).transfer(to.address, ethers.utils.parseEther("1") ,{value: ethers.utils.parseEther("1")});  
        var receipt1 = await tx1.wait();
        const event1 = receipt1.events.find(event => event.event === 'TransactionCreated');
        const [,,,_uid1] = event1.args;

        var tx2 = await multiSig.connect(from2).transfer(to2.address, ethers.utils.parseEther("1") ,{value: ethers.utils.parseEther("1")});  
        var receipt2 = await tx2.wait();
        const event2 = receipt2.events.find(event => event.event === 'TransactionCreated');
        const [,,,_uid2] = event2.args;

        var tx3 = await multiSig.connect(validator2).transfer(validator3.address, ethers.utils.parseEther("1") ,{value: ethers.utils.parseEther("1")});  
        var receipt3 = await tx3.wait();
        const event3 = receipt3.events.find(event => event.event === 'TransactionCreated');
        const [,,,_uid3] = event3.args;

        pendingTransactions = await multiSig.getAllPendingTransactions();
        expect(pendingTransactions.length).to.equal(3);
    });

    it('Should ONLY allow a validator to confirm a transaction ', async function () {
        var tx3 = await multiSig.connect(validator2).transfer(validator3.address, ethers.utils.parseEther("1") ,{value: ethers.utils.parseEther("1")});  
        var receipt3 = await tx3.wait();
        const event3 = receipt3.events.find(event => event.event === 'TransactionCreated');
        const [,,,_uid3] = event3.args;

        pendingTransactions = await multiSig.getAllPendingTransactions();
        expect(pendingTransactions.length).to.equal(1);
        await expect(multiSig.connect(from).confirmTransaction(_uid3)).to.be.revertedWith('Only Validator Allowed!');
    });

    it('Should execute the transaction after 2 confirmations', async function () {
        await multiSig.addValidator(validator2.address);
        var tx1 = await multiSig.connect(from).transfer(to.address, ethers.utils.parseEther("1"), {value: ethers.utils.parseEther("1")});  
        var receipt1 = await tx1.wait();
        const event1 = receipt1.events.find(event => event.event === 'TransactionCreated');
        const [,,,_uid1] = event1.args;
        pendingTransactions = await multiSig.getAllPendingTransactions();
        expect(pendingTransactions.length).to.equal(1);

        await multiSig.confirmTransaction(_uid1);
        pendingTransactions = await multiSig.getAllPendingTransactions();
        expect(pendingTransactions.length).to.equal(1);

        await expect(multiSig.confirmTransaction(_uid1)).to.be.revertedWith('Already Validated!');

        pendingTransactions = await multiSig.getAllPendingTransactions();
        expect(pendingTransactions.length).to.equal(1);
        
        var { 
            recepient,
            sender,
            executed,
            amount,
            numOfConfirmations
         } = await multiSig.getTransactionDetails(_uid1); 

         expect(executed).to.be.false;
         expect(numOfConfirmations).to.equal(1);

        await multiSig.connect(validator2).confirmTransaction(_uid1);
        pendingTransactions = await multiSig.getAllPendingTransactions();

        var { 
            recepient,
            sender,
            executed,
            amount,
            numOfConfirmations
         } = await multiSig.getTransactionDetails(_uid1); 

        expect(executed).to.be.true;
        expect(numOfConfirmations).to.equal(2);

        expect(pendingTransactions.length).to.equal(0);
    });

    it('Should NOT allow a validator to confirm if they are a participant in a transaction', async function () {
        await multiSig.addValidator(validator2.address);
        
        var tx1 = await multiSig.transfer(validator2.address, ethers.utils.parseEther("1"), {value: ethers.utils.parseEther("1")});  
        var receipt1 = await tx1.wait();
        const event1 = receipt1.events.find(event => event.event === 'TransactionCreated');
        const [,,,_uid1] = event1.args;


        var tx2 = await multiSig.connect(validator2).transfer(owner.address, ethers.utils.parseEther("1") ,{value: ethers.utils.parseEther("1")});  
        var receipt2 = await tx2.wait();
        const event2 = receipt2.events.find(event => event.event === 'TransactionCreated');
        const [,,,_uid2] = event2.args;


        pendingTransactions = await multiSig.getAllPendingTransactions();
        expect(pendingTransactions.length).to.equal(2);


        await expect(multiSig.confirmTransaction(_uid1)).to.be.revertedWith('Validator cant be the sender');
        await expect(multiSig.connect(validator2).confirmTransaction(_uid1)).to.be.revertedWith('Validator cant be the recepient');


        await expect(multiSig.connect(validator2).confirmTransaction(_uid2)).to.be.revertedWith('Validator cant be the sender');
        await expect(multiSig.confirmTransaction(_uid2)).to.be.revertedWith('Validator cant be the recepient');
    });

})