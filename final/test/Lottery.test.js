const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Lottery Contract", function () {
  let Lottery;
  let lottery;
  let owner;
  let addr1;
  let addr2;
  let addrs;
  
  // Initial parameters
  const ticketPrice = ethers.parseEther("0.01"); // 0.01 ETH
  const minTickets = 3;
  const lotteryDuration = 60 * 60 * 24; // 1 day in seconds
  
  beforeEach(async function () {
    // Get signers
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    
    // Deploy the contract
    Lottery = await ethers.getContractFactory("Lottery");
    lottery = await Lottery.deploy(ticketPrice, minTickets, lotteryDuration);
    await lottery.waitForDeployment();
  });
  
  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await lottery.owner()).to.equal(owner.address);
    });
    
    it("Should set the correct initial values", async function () {
      expect(await lottery.ticketPrice()).to.equal(ticketPrice);
      expect(await lottery.minTickets()).to.equal(minTickets);
      expect(await lottery.lotteryDuration()).to.equal(lotteryDuration);
      expect(await lottery.lotteryState()).to.equal(1); // CLOSED state
      expect(await lottery.currentRound()).to.equal(0);
    });
  });
  
  describe("Lottery Operations", function () {
    it("Should allow owner to start the lottery", async function () {
      await lottery.startLottery();
      expect(await lottery.lotteryState()).to.equal(0); // OPEN state
      expect(await lottery.currentRound()).to.equal(1);
      expect(await lottery.isLotteryActive()).to.equal(true);
    });
    
    it("Should not allow non-owners to start the lottery", async function () {
      await expect(
        lottery.connect(addr1).startLottery()
      ).to.be.revertedWithCustomError(lottery, "OwnableUnauthorizedAccount");
    });
    
    it("Should allow users to buy tickets", async function () {
      await lottery.startLottery();
      
      // Buy 2 tickets
      await lottery.connect(addr1).buyTickets(2, { value: ticketPrice * BigInt(2) });
      
      expect(await lottery.ticketsPurchased(addr1.address)).to.equal(2);
      expect(await lottery.getNumberOfParticipants()).to.equal(2);
    });
    
    it("Should not allow ticket purchase if lottery is not open", async function () {
      await expect(
        lottery.connect(addr1).buyTickets(1, { value: ticketPrice })
      ).to.be.revertedWith("Lottery is not open");
    });
    
    it("Should not allow ticket purchase with incorrect ETH amount", async function () {
      await lottery.startLottery();
      
      await expect(
        lottery.connect(addr1).buyTickets(2, { value: ticketPrice })
      ).to.be.revertedWith("Incorrect ETH amount");
    });
  });
  
  describe("Lottery Configuration", function () {
    it("Should allow owner to update ticket price", async function () {
      const newPrice = ethers.parseEther("0.02");
      await lottery.updateTicketPrice(newPrice);
      expect(await lottery.ticketPrice()).to.equal(newPrice);
    });
    
    it("Should allow owner to update minimum tickets", async function () {
      const newMinTickets = 5;
      await lottery.updateMinTickets(newMinTickets);
      expect(await lottery.minTickets()).to.equal(newMinTickets);
    });
    
    it("Should allow owner to update lottery duration", async function () {
      const newDuration = 60 * 60 * 48; // 2 days
      await lottery.updateLotteryDuration(newDuration);
      expect(await lottery.lotteryDuration()).to.equal(newDuration);
    });
  });
});