# DeFi Lottery Application

A decentralized lottery system built on Ethereum (Sepolia testnet) where users can buy tickets to participate, and a random winner is selected to receive the prize.

## Project Structure

- `contracts/`: Contains the Solidity smart contracts
  - `Lottery.sol`: The main lottery contract
- `scripts/`: Contains deployment scripts
  - `deploy.js`: Script to deploy the Lottery contract
- `test/`: Contains test files
  - `Lottery.test.js`: Tests for the Lottery contract
- `frontend/`: Contains the React frontend application

## Smart Contract Features

- Buy tickets to participate in the lottery
- Random winner selection
- Prize payout to the winner
- Multiple lottery rounds
- Owner controls for starting and ending lottery rounds
- Configurable ticket price, minimum tickets, and lottery duration

## Frontend Features

- Connect to MetaMask wallet
- View lottery information (state, ticket price, time remaining, etc.)
- Buy tickets to participate
- Start and end lottery rounds (owner only)
- View past winners

## Prerequisites

- Node.js and npm
- MetaMask browser extension
- Sepolia testnet ETH (for deployment and testing)

## Installation and Setup

### Smart Contract Deployment

1. Clone the repository:
   ```
   git clone <repository-url>
   cd blockchain/final
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   SEPOLIA_PRIVATE_KEY=your_private_key
   SEPOLIA_RPC_URL=your_sepolia_rpc_url
   ETHERSCAN_API_KEY=your_etherscan_api_key
   ```

4. Compile the contracts:
   ```
   npx hardhat compile
   ```

5. Deploy to Sepolia testnet:
   ```
   npx hardhat run scripts/deploy.js --network sepolia
   ```

6. Update the contract address in the frontend:
   - Copy the deployed contract address from the console
   - Update the `LOTTERY_CONTRACT_ADDRESS` variable in `frontend/src/App.js`

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

### As a User

1. Connect your MetaMask wallet to the application
2. Make sure you're on the Sepolia testnet
3. View the current lottery information
4. Buy tickets to participate when the lottery is open
5. Wait for the lottery to end and see if you're the winner

### As the Owner

1. Connect your MetaMask wallet (the one used for deployment)
2. Start a new lottery round when the lottery is closed
3. End the lottery round when the time has passed
4. Configure lottery parameters (ticket price, minimum tickets, duration)

## Testing

Run the tests with:
```
npx hardhat test
```

## Security Considerations

- The random number generation in the contract is not cryptographically secure and is vulnerable to miner manipulation. In a production environment, consider using Chainlink VRF or similar.
- The contract has not been audited and should not be used with real funds.

## License

MIT