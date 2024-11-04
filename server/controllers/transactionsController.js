require("dotenv").config();
const Web3 = require("web3").default; // Ensure proper import of Web3
const fetch = require("node-fetch");
const { create } = require("ipfs-http-client");
const { NFTMetadata, Transaction } = require("../models/newAdded.js"); // Ensure these paths are correct

require("dotenv").config();

// Initialize Web3 and IPFS client
const web3 = new Web3(process.env.ALCHEMY_URL);
if (!web3) {
  console.error("Failed to initialize Web3.");
  process.exit(1);
}

const ipfs = create({ url: "https://ipfs.infura.io:5001/api/v0" }); // Initialize IPFS client

// Ensure required environment variables are set
if (
  !process.env.ALCHEMY_URL ||
  !process.env.MONGO_URI ||
  !process.env.PORT ||
  !process.env.TOKEN_CONTRACT_ADDRESS ||
  !process.env.PRIVATE_KEY
) {
  console.error("Missing required environment variables.");
  process.exit(1);
}

const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];

const NFT_ABI = [
  {
    constant: true,
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ name: "", type: "string" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];

const tokenContract = new web3.eth.Contract(
  ERC20_ABI,
  process.env.TOKEN_CONTRACT_ADDRESS
);

// Function to create a transaction
const createTransaction = async (req, res) => {
  const { id, quantity, price, spent, date } = req.body;
  const user_id = req.user._id;

  if (!user_id) {
    return res.status(400).json({ error: "User ID is required" });
  }
  if (!id || !quantity || !price || !spent || !date) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const transaction = await Transaction.create({
      id,
      quantity,
      price,
      spent,
      date,
      user_id,
    });

    let portfolio = await PortfolioSchema.findOne({ user_id });

    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    res.status(200).json(transaction);
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(400).json({ error: error.message });
  }
};

// Function to get transactions
const getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const userFolio = await PortfolioSchema.findOne({
      user_id: userId,
    }).populate("transactions");

    if (!userFolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    res.status(200).json(userFolio.transactions);
  } catch (error) {
    console.error("Error retrieving user portfolio:", error);
    res.status(500).json({
      error: "An error occurred while retrieving user portfolio.",
    });
  }
};

// Function to retrieve NFT metadata
const NFT_metadata = async (req, res) => {
  const { contractAddress, tokenId } = req.query;

  if (!contractAddress || !tokenId) {
    return res
      .status(400)
      .json({ error: "contractAddress and tokenId are required." });
  }

  const contract = new web3.eth.Contract(NFT_ABI, contractAddress);

  try {
    const metadata = await contract.methods.tokenURI(tokenId).call();
    const response = await fetch(metadata);

    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.statusText}`);
    }

    const json = await response.json();
    const nft = new NFTMetadata(json);
    await nft.save();

    res.status(200).json(json);
  } catch (error) {
    console.error("Error fetching NFT metadata:", error);
    res.status(500).json({
      error: "Failed to retrieve NFT metadata",
      details: error.message,
    });
  }
};

// Function to get token balance
const getTokenBalance = async (req, res) => {
  const { contractAddress, walletAddress } = req.query;

  if (!contractAddress || !walletAddress) {
    return res
      .status(400)
      .json({ error: "contractAddress and walletAddress are required." });
  }

  const contract = new web3.eth.Contract(ERC20_ABI, contractAddress);

  try {
    const balance = await contract.methods.balanceOf(walletAddress).call();
    res.status(200).json({ balance });
  } catch (error) {
    console.error("Error retrieving token balance:", error);
    res.status(500).json({
      error: "Failed to retrieve token balance",
      details: error.message,
    });
  }
};

// Function to retrieve data from IPFS
const Ipfs_Hash = async (req, res) => {
  const { hash } = req.params;

  try {
    const stream = ipfs.cat(hash);
    let data = "";

    for await (const chunk of stream) {
      data += chunk.toString();
    }

    res.status(200).send(data);
  } catch (error) {
    console.error("Error retrieving from IPFS:", error);
    res
      .status(500)
      .json({ error: "Failed to retrieve from IPFS", details: error.message });
  }
};

// Function to handle token transfers
const getTransfer = async (req, res) => {
  const { from, to, amount } = req.body;

  if (!from || !to || !amount) {
    return res
      .status(400)
      .json({ error: "From, to, and amount are required." });
  }

  try {
    const gasPrice = await web3.eth.getGasPrice();
    const gasEstimate = await tokenContract.methods
      .transfer(to, amount)
      .estimateGas({ from });

    const tx = {
      from,
      to, // Ensure this is the actual recipient address
      data: tokenContract.methods.transfer(to, amount).encodeABI(),
      gas: gasEstimate,
      gasPrice: gasPrice,
    };

    const signedTx = await web3.eth.accounts.signTransaction(
      tx,
      process.env.PRIVATE_KEY
    );
    const receipt = await web3.eth.sendSignedTransaction(
      signedTx.rawTransaction
    );

    const transaction = new Transaction({
      from,
      to,
      amount,
      transactionHash: receipt.transactionHash,
    });
    await transaction.save();

    res
      .status(200)
      .json({ success: true, transactionHash: receipt.transactionHash });
  } catch (error) {
    console.error("Error during transfer:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransfer,
  getTokenBalance,
  Ipfs_Hash,
  NFT_metadata,
};
