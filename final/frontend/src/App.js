import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './index.css';

// ABI will be replaced with the actual ABI after contract compilation
const LOTTERY_ABI = [
  "function owner() view returns (address)",
  "function ticketPrice() view returns (uint256)",
  "function minTickets() view returns (uint256)",
  "function currentRound() view returns (uint256)",
  "function lotteryState() view returns (uint8)",
  "function lotteryStartTime() view returns (uint256)",
  "function lotteryDuration() view returns (uint256)",
  "function ticketsPurchased(address) view returns (uint256)",
  "function getNumberOfParticipants() view returns (uint256)",
  "function isLotteryActive() view returns (bool)",
  "function getTimeRemaining() view returns (uint256)",
  "function getRoundWinner(uint256) view returns (address, uint256)",
  "function buyTickets(uint256) payable",
  "function startLottery()",
  "function endLottery()"
];

// Contract address will be replaced after deployment
const LOTTERY_CONTRACT_ADDRESS = "0xeB889B31cfF310975224770fce61762255bdd401";

function App() {
  // State variables
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [ticketPrice, setTicketPrice] = useState('0');
  const [minTickets, setMinTickets] = useState(0);
  const [currentRound, setCurrentRound] = useState(0);
  const [lotteryState, setLotteryState] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [participants, setParticipants] = useState(0);
  const [ticketsBought, setTicketsBought] = useState(0);
  const [numTickets, setNumTickets] = useState(1);
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Connect to MetaMask
  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(LOTTERY_CONTRACT_ADDRESS, LOTTERY_ABI, signer);

        setProvider(provider);
        setSigner(signer);
        setContract(contract);
        setAccount(accounts[0]);

        // Check if connected account is the owner
        const owner = await contract.owner();
        setIsOwner(owner.toLowerCase() === accounts[0].toLowerCase());

        // Setup event listener for account changes
        window.ethereum.on('accountsChanged', (accounts) => {
          setAccount(accounts[0]);
          window.location.reload();
        });

        // Setup event listener for chain changes
        window.ethereum.on('chainChanged', () => {
          window.location.reload();
        });

        return true;
      } else {
        setError("Please install MetaMask to use this dApp");
        return false;
      }
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      setError("Error connecting to wallet. Please try again.");
      return false;
    }
  };

  // Load contract data
  const loadContractData = async () => {
    if (contract) {
      try {
        setLoading(true);

        // Get contract data
        const ticketPrice = await contract.ticketPrice();
        const minTickets = await contract.minTickets();
        const currentRound = await contract.currentRound();
        const lotteryState = await contract.lotteryState();
        const timeRemaining = await contract.getTimeRemaining();
        const participants = await contract.getNumberOfParticipants();
        const ticketsBought = await contract.ticketsPurchased(account);

        // Update state
        setTicketPrice(ethers.formatEther(ticketPrice));
        setMinTickets(Number(minTickets));
        setCurrentRound(Number(currentRound));
        setLotteryState(Number(lotteryState));
        setTimeRemaining(Number(timeRemaining));
        setParticipants(Number(participants));
        setTicketsBought(Number(ticketsBought));

        // Load past winners if there are any
        if (currentRound > 0) {
          const winners = [];
          for (let i = 1; i <= currentRound; i++) {
            try {
              const [winner, prize] = await contract.getRoundWinner(i);
              if (winner !== ethers.ZeroAddress) {
                winners.push({
                  round: i,
                  address: winner,
                  prize: ethers.formatEther(prize)
                });
              }
            } catch (error) {
              console.error(`Error fetching winner for round ${i}:`, error);
            }
          }
          setWinners(winners);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading contract data:", error);
        setError("Error loading contract data. Please try again.");
        setLoading(false);
      }
    }
  };

  // Buy tickets
  const buyTickets = async () => {
    if (contract && numTickets > 0) {
      try {
        setLoading(true);
        setError('');

        const price = ethers.parseEther(ticketPrice) * BigInt(numTickets);
        const tx = await contract.buyTickets(numTickets, { value: price });
        await tx.wait();

        // Reload contract data
        await loadContractData();

        setLoading(false);
      } catch (error) {
        console.error("Error buying tickets:", error);
        setError("Error buying tickets. Please try again.");
        setLoading(false);
      }
    }
  };

  // Start lottery (owner only)
  const startLottery = async () => {
    if (contract && isOwner) {
      try {
        setLoading(true);
        setError('');

        const tx = await contract.startLottery();
        await tx.wait();

        // Reload contract data
        await loadContractData();

        setLoading(false);
      } catch (error) {
        console.error("Error starting lottery:", error);
        setError("Error starting lottery. Please try again.");
        setLoading(false);
      }
    }
  };

  // End lottery (owner only)
  const endLottery = async () => {
    if (contract && isOwner) {
      try {
        setLoading(true);
        setError('');

        const tx = await contract.endLottery();
        await tx.wait();

        // Reload contract data
        await loadContractData();

        setLoading(false);
      } catch (error) {
        console.error("Error ending lottery:", error);
        setError("Error ending lottery. Please try again.");
        setLoading(false);
      }
    }
  };

  // Format time remaining
  const formatTimeRemaining = (seconds) => {
    if (seconds <= 0) return "Ended";

    const days = Math.floor(seconds / (60 * 60 * 24));
    const hours = Math.floor((seconds % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    const secs = Math.floor(seconds % 60);

    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  };

  // Get lottery state text
  const getLotteryStateText = (state) => {
    switch (state) {
      case 0: return "Open";
      case 1: return "Closed";
      case 2: return "Drawing Winner";
      default: return "Unknown";
    }
  };

  // Helper function to truncate Ethereum address
  const truncateAddress = (address) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Effect to connect wallet and load data on component mount
  useEffect(() => {
    const init = async () => {
      const connected = await connectWallet();
      if (connected) {
        await loadContractData();
      }
    };

    init();

    // Set up interval to update time remaining
    const interval = setInterval(() => {
      if (timeRemaining > 0) {
        setTimeRemaining(prev => prev - 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Effect to reload data when contract or account changes
  useEffect(() => {
    if (contract && account) {
      loadContractData();
    }
  }, [contract, account]);

  return (
    <div className="container">
      <h1>DeFi Lottery</h1>

      {account && (
        <div className="account-banner">
          <div>
            <span>Connected Account: </span>
            <span className="account-address" title={account}>{truncateAddress(account)}</span>
          </div>
          <div>
            <span>{isOwner ? '(Owner)' : '(User)'}</span>
          </div>
        </div>
      )}

      {!account ? (
        <div className="card">
          <h2>Connect Your Wallet</h2>
          <button className="button" onClick={connectWallet}>Connect Wallet</button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      ) : (
        <>
          <div className="card">
            <h2>Account Information</h2>
            <p><strong>Connected Account:</strong> {account}</p>
            <p><strong>Role:</strong> {isOwner ? 'Owner' : 'User'}</p>
            <p><strong>Tickets Purchased:</strong> {ticketsBought}</p>
          </div>

          <div className="card">
            <h2>Lottery Information</h2>
            <p><strong>Current Round:</strong> {currentRound}</p>
            <p><strong>Lottery State:</strong> {getLotteryStateText(lotteryState)}</p>
            <p><strong>Ticket Price:</strong> {ticketPrice} ETH</p>
            <p><strong>Minimum Tickets Required:</strong> {minTickets}</p>
            <p><strong>Participants:</strong> {participants}</p>
            <p><strong>Time Remaining:</strong> {formatTimeRemaining(timeRemaining)}</p>
          </div>

          {lotteryState === 0 && (
            <div className="card">
              <h2>Buy Tickets</h2>
              <div>
                <label>Number of Tickets:</label>
                <input
                  type="number"
                  min="1"
                  value={numTickets}
                  onChange={(e) => setNumTickets(Math.max(1, parseInt(e.target.value) || 1))}
                  className="input"
                />
                <p>Total Cost: {(parseFloat(ticketPrice) * numTickets).toFixed(4)} ETH</p>
                <button
                  className="button"
                  onClick={buyTickets}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Buy Tickets'}
                </button>
              </div>
            </div>
          )}

          {isOwner && (
            <div className="card">
              <h2>Owner Controls</h2>
              {lotteryState === 1 && (
                <button
                  className="button"
                  onClick={startLottery}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Start Lottery'}
                </button>
              )}
              {lotteryState === 0 && (
                <button
                  className="button"
                  onClick={endLottery}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'End Lottery'}
                </button>
              )}
            </div>
          )}

          {winners.length > 0 && (
            <div className="card">
              <h2>Past Winners</h2>
              <ul>
                {winners.map((winner) => (
                  <li key={winner.round}>
                    <strong>Round {winner.round}:</strong> {winner.address} won {winner.prize} ETH
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && <p style={{ color: 'red' }}>{error}</p>}
        </>
      )}
    </div>
  );
}

export default App;
