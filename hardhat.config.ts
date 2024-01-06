import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.19',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    ancient8Testnet: {
      url: 'https://rpc-testnet.ancient8.gg',
      chainId: 2863311531,
    },
    ancient8TestnetV2: {
      url: 'https://rpcv2-testnet.ancient8.gg',
      chainId: 28122024,
    },
  },
  typechain: {
    outDir: './sdk/typescript/typechain',
  },
};

export default config;
