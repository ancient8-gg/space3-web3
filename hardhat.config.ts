import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";
import * as Dotenv from "dotenv";
Dotenv.config();

const ADMIN_PK = process.env.ADMIN_PK || "";
const ACCOUNTS = [ADMIN_PK];

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      saveDeployments: false,
      allowUnlimitedContractSize: false,
    },
    ancient8Testnet: {
      url: "https://rpc-testnet.ancient8.gg",
      chainId: 2863311531,
      accounts: ACCOUNTS,
      saveDeployments: true,
      allowUnlimitedContractSize: false,
    },
    ancient8TestnetV2: {
      url: "https://rpcv2-testnet.ancient8.gg",
      chainId: 28122024,
      accounts: ACCOUNTS,
      saveDeployments: true,
      allowUnlimitedContractSize: false,
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  mocha: {},
  etherscan: {
    apiKey: {
      ancient8Testnet: process.env.ANCIENT8_TESTNET_API_KEY || "",
      ancient8TestnetV2: process.env.ANCIENT8_TESTNET_V2_API_KEY || "",
    },
    customChains: [
      {
        network: "ancient8Testnet",
        chainId: 2863311531,
        urls: {
          apiURL: "https://testnet.a8scan.io/api/v2",
          browserURL: "https://testnet.a8scan.io",
        },
      },
      {
        network: "ancient8TestnetV2",
        chainId: 28122024,
        urls: {
          apiURL: "https://scanv2-testnet.ancient8.gg/api/v2",
          browserURL: "https://scanv2-testnet.ancient8.gg",
        },
      },
    ],
  },
  typechain: {
    outDir: "./sdk/typescript/typechain",
  },
};

export default config;
