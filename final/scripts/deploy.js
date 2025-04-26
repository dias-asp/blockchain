const { ethers, network, run } = require("hardhat");

async function main() {

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);


  const ticketPrice = ethers.parseEther("0.01");
  const minTickets = 3;
  const lotteryDuration = 60 * 60 * 24 * 7;

  console.log("Deploying contracts with the following parameters:");
  console.log(ticketPrice, minTickets, lotteryDuration);
  // Deploy the Lottery contract
  /*
  const Lottery = await ethers.getContractFactory("Lottery");
  const lottery = await Lottery.deploy(ticketPrice, minTickets, lotteryDuration);
  await lottery.waitForDeployment();*/

  // const lotteryAddress = await lottery.getAddress();
  const lotteryAddress = "0xec840Bb379B7447Aa17E3b7E44cde33EE592e802";
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
