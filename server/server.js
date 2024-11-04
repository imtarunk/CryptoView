//Config express
const express = require("express");
const dotenv = require("dotenv");
const process = require("process");
const workoutRoutes = require("./routes/workouts.js");
const usersRoutes = require("./routes/users.js");
const transactionsRoutes = require("./routes/Transactions.js");
const userPortfolio = require("./routes/userPortfolio.js");
const mongoose = require("mongoose");
const cors = require("cors");

dotenv.config();

const app = express();

// configuration cors
const corsOptions = {
  origin: ["http://localhost:5173", "https://api.coingecko.com/"],
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// middleware pour parser le json
app.use(express.json());

// middleware pour logger les requetes
app.use((req, res, next) => {
  console.log(req.path, req.method);
  next();
});

// routes
app.use("/api/workouts/", workoutRoutes);
app.use("/api/portfolio/", userPortfolio);
app.use("/api/transactions/", transactionsRoutes);
app.use("/api/users/", usersRoutes);

//connect to db et lancement du server
mongoose
  .connect(process.env.MONG_URI)
  .then(() => {
    // listen requests
    console.log(`connected to db`);
  })
  .catch((error) => {
    // console.log(error);
  });

// Initialize Web3
const web3 = new Web3(process.env.ALCHEMY_URL);
const tokenContract = new web3.eth.Contract(
  ERC20_ABI,
  process.env.TOKEN_CONTRACT_ADDRESS
);

// Connect to Alchemy
web3.eth.net
  .isListening()
  .then(() => console.log("Connected to Alchemy"))
  .catch((e) => console.log("Error connecting to Alchemy", e));

app.listen(process.env.PORT, () => {
  console.log(`listening on port ${process.env.PORT}`);
});
