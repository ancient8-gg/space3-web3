import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import 'hardhat-gas-reporter'
import 'hardhat-deploy'
import * as Dotenv from 'dotenv'
Dotenv.config()

const ADMIN_PK = process.env.ADMIN_PK || ''
const ACCOUNTS = [ADMIN_PK]

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.20',
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
      url: 'https://rpc-testnet.ancient8.gg',
      chainId: 2863311531,
      accounts: ACCOUNTS,
      saveDeployments: true,
      allowUnlimitedContractSize: false,
    },
    ancient8TestnetV2: {
      url: 'https://rpcv2-testnet.ancient8.gg',
      chainId: 28122024,
      accounts: ACCOUNTS,
      saveDeployments: true,
      allowUnlimitedContractSize: false,
    },
    ancient8Mainnet: {
      url: 'https://rpc.ancient8.gg',
      chainId: 888888888,
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
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
  },
  mocha: {},
  etherscan: {
    apiKey: {
      ancient8Testnet: process.env.ANCIENT8_TESTNET_API_KEY || '',
      ancient8TestnetV2: process.env.ANCIENT8_TESTNET_V2_API_KEY || '',
      ancient8Mainnet: process.env.ANCIENT8_MAINNET_API_KEY || '',
    },
    customChains: [
      {
        network: 'ancient8Testnet',
        chainId: 2863311531,
        urls: {
          apiURL: 'https://testnet.a8scan.io/api',
          browserURL: 'https://testnet.a8scan.io',
        },
      },
      {
        network: 'ancient8TestnetV2',
        chainId: 28122024,
        urls: {
          apiURL: 'https://scanv2-testnet.ancient8.gg/api',
          browserURL: 'https://scanv2-testnet.ancient8.gg',
        },
      },
      {
        network: 'ancient8Mainnet',
        chainId: 888888888,
        urls: {
          apiURL: 'https://scan.ancient8.gg/api',
          browserURL: 'https://scan.ancient8.gg',
        },
      },
    ],
  },
  typechain: {
    outDir: './sdk/typescript/typechain',
  },
}

export default config
