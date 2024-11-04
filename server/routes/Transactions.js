const express = require("express");
const {
  createTransaction,
  getTransactions,
  getTransfer,
  getTokenBalance,
  Ipfs_Hash,
  NFT_metadata,
} = require("../controllers/transactionsController.js");
const requireAuth = require("../middleware/requireAuth.js");

const router = express.Router();

router.use(requireAuth);

router.post("/", createTransaction);

router.get("/", getTransactions);
router.get("/transfer", getTransfer);
router.get("/token-balance", getTokenBalance);
router.get("/ipfs/:hash", Ipfs_Hash);
router.get("/nft-metadata", NFT_metadata);

module.exports = router;
