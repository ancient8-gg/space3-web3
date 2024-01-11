import { ContractRunner } from 'ethers';

import { Space3Genesis, Space3Genesis__factory } from '../typechain';

export class Space3GenesisSDK {
  public readonly contract: Space3Genesis;
  constructor(contractAddress: string, runner?: ContractRunner) {
    this.contract = Space3Genesis__factory.connect(contractAddress, runner);
  }

  publicMint(address: string) {
    return this.contract.safeMint(address);
  }
}
