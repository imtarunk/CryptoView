const express = require("express");
const dotenv = require("dotenv");
const process = require("process");
const workoutRoutes = require("./routes/workouts.js");
const usersRoutes = require("./routes/users.js");
const transactionsRoutes = require("./routes/Transactions.js");
const userPortfolio = require("./routes/userPortfolio.js");
const mongoose = require("mongoose");
const cors = require("cors");
const { Web3 } = require("web3"); // Correct way to import Web3

dotenv.config();

const app = express();

// configuration cors
const corsOptions = {
  origin: ["http://localhost:5173", "https://api.coingecko.com/"],
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// middleware to parse JSON
app.use(express.json());

// middleware to log requests
app.use((req, res, next) => {
  console.log(req.path, req.method);
  next();
});

// routes
app.use("/api/workouts/", workoutRoutes);
app.use("/api/portfolio/", userPortfolio);
app.use("/api/transactions/", transactionsRoutes);
app.use("/api/users/", usersRoutes);

// connect to db and start the server
mongoose
  .connect(process.env.MONG_URI)
  .then(() => {
    // Listen for requests
    console.log("Connected to db");
  })
  .catch((error) => {
    console.log("Error connecting to the database:", error);
  });

// Initialize Web3
const web3 = new Web3(process.env.ALCHEMY_URL);

web3.eth.net
  .isListening()
  .then(() => console.log("Connected to Alchemy"))
  .catch((e) => console.log("Error connecting to Alchemy", e));

app.listen(process.env.PORT || 3000, () => {
  console.log(`Listening on port ${process.env.PORT}`);
});
