const { ethers, network, run } = require("hardhat");

async function main() {
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Initial parameters for the lottery
  const ticketPrice = ethers.parseEther("0.01"); // 0.01 ETH per ticket
  const minTickets = 3; // Minimum 3 tickets to draw a winner
  const lotteryDuration = 60 * 60 * 24 * 7; // 7 days in seconds

  console.log("Deploying contracts with the following parameters:");
  console.log(ticketPrice, minTickets, lotteryDuration);
  // Deploy the Lottery contract
  /*
  const Lottery = await ethers.getContractFactory("Lottery");
  const lottery = await Lottery.deploy(ticketPrice, minTickets, lotteryDuration);
  await lottery.waitForDeployment();*/

  // const lotteryAddress = await lottery.getAddress();
  const lotteryAddress = "0xeB889B31cfF310975224770fce61762255bdd401";
  console.log("Lottery contract deployed at:", lotteryAddress);

  /*
  // Verify contract on Etherscan if on Sepolia network
  if (network.config.chainId === 11155111 && process.env.ETHERSCAN_API_KEY) {
    console.log("Waiting for 6 confirmations before verification...");
    await lottery.deploymentTransaction().wait(6);
    await run("verify:verify", {
      address: lotteryAddress,
      constructorArguments: [ticketPrice, minTickets, lotteryDuration],
    });
    console.log("Contract verified on Etherscan");
  }*/

  console.log("Deployment completed!");
  console.log("Ticket Price:", ethers.formatEther(ticketPrice), "ETH");
  console.log("Minimum Tickets:", minTickets);
  console.log("Lottery Duration:", lotteryDuration, "seconds (", lotteryDuration / (60 * 60 * 24), "days )");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// for deploy: npx hardhat run scripts/deploy.js --network sepolia
