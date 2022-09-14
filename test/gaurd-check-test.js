const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { LOCAL_NETWORKS } = require('../hardhat.config.js');

LOCAL_NETWORKS.includes(network.name) ? 
  describe ("GuardCheck", function () {
    it("Should not be able to set condition more than once", async function () {
      const GuardCheck = await ethers.getContractFactory("GuardCheck");
      const guardCheck = await GuardCheck.deploy();
      await guardCheck.deployed();
    
      const guardCheckTx = await guardCheck.test(0);
      await guardCheckTx.wait();
      expect(await guardCheck.condition()).to.equal(5);

      await expect(guardCheck.test(0)).to.be.revertedWith("Its been set");
    });
  })
:
  describe ("GuardCheck Remote", function () {
  });