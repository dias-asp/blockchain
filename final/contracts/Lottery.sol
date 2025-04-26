// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
//import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title Lottery
 * @dev A decentralized lottery system where users can buy tickets and a random winner is selected
 */
contract Lottery is Ownable {
    // Ticket price in wei
    uint256 public ticketPrice;
    
    // Minimum number of tickets required to draw a winner
    uint256 public minTickets;
    
    // Current lottery round
    uint256 public currentRound;
    
    // Timestamp when the lottery started
    uint256 public lotteryStartTime;
    
    // Duration of the lottery in seconds
    uint256 public lotteryDuration;
    
    // Mapping from round to participants
    mapping(uint256 => address[]) public roundToParticipants;
    
    // Mapping from address to number of tickets purchased in current round
    mapping(address => uint256) public ticketsPurchased;
    
    // Mapping from round to winner
    mapping(uint256 => address) public roundToWinner;
    
    // Mapping from round to prize amount
    mapping(uint256 => uint256) public roundToPrize;
    
    // Lottery state
    enum LotteryState { OPEN, CLOSED, DRAWING_WINNER }
    LotteryState public lotteryState;
    
    // Events
    event TicketPurchased(address indexed buyer, uint256 amount);
    event WinnerSelected(address indexed winner, uint256 prize, uint256 round);
    event LotteryStarted(uint256 startTime, uint256 duration, uint256 round);
    event LotteryEnded(uint256 endTime, uint256 round);
    
    /**
     * @dev Constructor to initialize the lottery
     * @param _ticketPrice Price of each ticket in wei
     * @param _minTickets Minimum number of tickets required to draw a winner
     * @param _lotteryDuration Duration of the lottery in seconds
     */
    constructor(uint256 _ticketPrice, uint256 _minTickets, uint256 _lotteryDuration) Ownable(msg.sender) {
        require(_ticketPrice > 0, "Ticket price must be greater than 0");
        require(_minTickets > 1, "Minimum tickets must be greater than 1");
        require(_lotteryDuration > 0, "Lottery duration must be greater than 0");
        
        ticketPrice = _ticketPrice;
        minTickets = _minTickets;
        lotteryDuration = _lotteryDuration;
        lotteryState = LotteryState.CLOSED;
        currentRound = 0;
    }
    
    /**
     * @dev Start a new lottery round
     */
    function startLottery() external onlyOwner {
        require(lotteryState == LotteryState.CLOSED, "Lottery is not closed");
        
        lotteryState = LotteryState.OPEN;
        currentRound++;
        lotteryStartTime = block.timestamp;
        
        emit LotteryStarted(lotteryStartTime, lotteryDuration, currentRound);
    }
    
    /**
     * @dev End the current lottery round
     */
    function endLottery() external onlyOwner {
        require(lotteryState == LotteryState.OPEN, "Lottery is not open");

        lotteryState = LotteryState.DRAWING_WINNER;

        emit LotteryEnded(block.timestamp, currentRound);

        // If enough tickets were sold, draw a winner
        if (roundToParticipants[currentRound].length >= minTickets) {
            drawWinner();
        } else {
            // If not enough tickets were sold, refund all participants
            refundAll();
            lotteryState = LotteryState.CLOSED;
        }
    }

    /**
     * @dev Purchase tickets for the lottery
     * @param _numTickets Number of tickets to purchase
     */
    function buyTickets(uint256 _numTickets) external payable {
        require(lotteryState == LotteryState.OPEN, "Lottery is not open");
        require(block.timestamp < lotteryStartTime + lotteryDuration, "Lottery has ended");
        require(_numTickets > 0, "Must purchase at least one ticket");
        require(msg.value == ticketPrice * _numTickets, "Incorrect ETH amount");

        // Add participant to the current round
        for (uint256 i = 0; i < _numTickets; i++) {
            roundToParticipants[currentRound].push(msg.sender);
        }

        // Update tickets purchased
        ticketsPurchased[msg.sender] += _numTickets;

        emit TicketPurchased(msg.sender, _numTickets);
    }

    /**
     * @dev Draw a winner for the current lottery round
     * Uses block timestamp, difficulty, and participant addresses to generate randomness
     * Note: This is not cryptographically secure and is vulnerable to miner manipulation
     * In a production environment, consider using Chainlink VRF or similar
     */
    function drawWinner() internal {
        require(lotteryState == LotteryState.DRAWING_WINNER, "Not in drawing state");
        require(roundToParticipants[currentRound].length >= minTickets, "Not enough participants");

        // Calculate total prize
        uint256 totalPrize = address(this).balance;

        // Generate a random index
        uint256 randomIndex = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            roundToParticipants[currentRound]
        ))) % roundToParticipants[currentRound].length;

        // Select winner
        address winner = roundToParticipants[currentRound][randomIndex];

        // Record winner and prize
        roundToWinner[currentRound] = winner;
        roundToPrize[currentRound] = totalPrize;

        // Transfer prize to winner
        (bool success, ) = winner.call{value: totalPrize}("");
        require(success, "Transfer failed");

        emit WinnerSelected(winner, totalPrize, currentRound);

        // Reset for next round
        lotteryState = LotteryState.CLOSED;

        // Reset tickets purchased
        for (uint256 i = 0; i < roundToParticipants[currentRound].length; i++) {
            address participant = roundToParticipants[currentRound][i];
            ticketsPurchased[participant] = 0;
        }
    }

    /**
     * @dev Refund all participants if minimum tickets were not sold
     */
    function refundAll() internal {
        for (uint256 i = 0; i < roundToParticipants[currentRound].length; i++) {
            address participant = roundToParticipants[currentRound][i];
            uint256 refundAmount = ticketsPurchased[participant] * ticketPrice;

            if (refundAmount > 0) {
                ticketsPurchased[participant] = 0;
                (bool success, ) = participant.call{value: refundAmount}("");
                require(success, "Refund failed");
            }
        }
    }

    /**
     * @dev Get the number of participants in the current round
     * @return Number of participants
     */
    function getNumberOfParticipants() external view returns (uint256) {
        return roundToParticipants[currentRound].length;
    }

    /**
     * @dev Get the winner of a specific round
     * @param _round Round number
     * @return Winner address and prize amount
     */
    function getRoundWinner(uint256 _round) external view returns (address, uint256) {
        require(_round > 0 && _round <= currentRound, "Invalid round");
        return (roundToWinner[_round], roundToPrize[_round]);
    }

    /**
     * @dev Check if lottery is active
     * @return True if lottery is open, false otherwise
     */
    function isLotteryActive() external view returns (bool) {
        return lotteryState == LotteryState.OPEN &&
               block.timestamp < lotteryStartTime + lotteryDuration;
    }

    /**
     * @dev Get time remaining in current lottery
     * @return Time remaining in seconds
     */
    function getTimeRemaining() external view returns (uint256) {
        if (lotteryState != LotteryState.OPEN ||
            block.timestamp >= lotteryStartTime + lotteryDuration) {
            return 0;
        }

        return (lotteryStartTime + lotteryDuration) - block.timestamp;
    }

    /**
     * @dev Update ticket price (only owner)
     * @param _newPrice New ticket price in wei
     */
    function updateTicketPrice(uint256 _newPrice) external onlyOwner {
        require(lotteryState == LotteryState.CLOSED, "Cannot update during active lottery");
        require(_newPrice > 0, "Price must be greater than 0");
        ticketPrice = _newPrice;
    }

    /**
     * @dev Update minimum tickets required (only owner)
     * @param _newMinTickets New minimum tickets
     */
    function updateMinTickets(uint256 _newMinTickets) external onlyOwner {
        require(lotteryState == LotteryState.CLOSED, "Cannot update during active lottery");
        require(_newMinTickets > 1, "Minimum tickets must be greater than 1");
        minTickets = _newMinTickets;
    }

    /**
     * @dev Update lottery duration (only owner)
     * @param _newDuration New duration in seconds
     */
    function updateLotteryDuration(uint256 _newDuration) external onlyOwner {
        require(lotteryState == LotteryState.CLOSED, "Cannot update during active lottery");
        require(_newDuration > 0, "Duration must be greater than 0");
        lotteryDuration = _newDuration;
    }
}

//10000000000000 3 3600