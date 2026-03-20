require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const ALCHEMY_URL = process.env.ALCHEMY_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";

module.exports = {
  solidity: "0.8.20",
  networks: {
    ganache: {
      url: "http://127.0.0.1:8545",
      chainId: 1337
    },
    sepolia: {
      url: ALCHEMY_URL,
      chainId: 11155111,
      accounts: [PRIVATE_KEY]
    }
  }
};
