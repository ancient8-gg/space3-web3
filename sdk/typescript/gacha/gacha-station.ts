import { ethers, ContractRunner, toUtf8Bytes } from 'ethers'
import {
  ERC20__factory,
  GachaStation,
  GachaStation__factory,
} from '../typechain'

enum TokenType {
  NATIVE,
  ERC20,
  ERC721,
  ERC1155,
}

export class GachaStationSDK {
  public readonly contract: GachaStation

  constructor(contractAddress: string, runner: ContractRunner) {
    this.contract = GachaStation__factory.connect(contractAddress, runner)
  }

  public async setRewardOwner(
    ownerAddress: string,
    amount: number,
    tokenId: number = 0,
    tokenAddr: string = ethers.ZeroAddress,
    tokenType: TokenType,
  ) {
    let rewardAmount = 0n
    let tokenTypeBytes: string

    switch (tokenType) {
      case TokenType.NATIVE:
        rewardAmount = ethers.parseEther(`${amount}`)
        tokenTypeBytes = ethers.ZeroHash
        break
      case TokenType.ERC20:
        const token = ERC20__factory.connect(tokenAddr, this.contract.runner)
        const decimals = await token.decimals()
        rewardAmount = ethers.parseUnits(`${amount}`, decimals)
        tokenTypeBytes = ethers.keccak256(toUtf8Bytes('ERC20'))
        break
      case TokenType.ERC721:
        rewardAmount = BigInt(amount)
        tokenTypeBytes = ethers.keccak256(toUtf8Bytes('ERC721'))
        break
      case TokenType.ERC1155:
        rewardAmount = BigInt(amount)
        tokenTypeBytes = ethers.keccak256(toUtf8Bytes('ERC1155'))
        break
      default:
        throw new Error('Unsupported token type')
    }

    const reward = {
      amount: rewardAmount,
      tokenId,
      tokenAddr,
      tokenType: tokenTypeBytes,
    }

    return await this.contract.setRewardOwner(ownerAddress, reward)
  }
}
