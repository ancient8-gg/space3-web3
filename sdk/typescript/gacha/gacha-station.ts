import { ethers, ContractRunner, toUtf8Bytes, toNumber } from 'ethers'
import {
  ERC20__factory,
  GachaStation,
  GachaStation__factory,
} from '../typechain'

export enum TokenType {
  NATIVE = 'NATIVE',
  ERC20 = 'ERC-20',
  ERC721 = 'ERC-721',
  ERC1155 = 'ERC-1155',
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
        rewardAmount = ethers.parseEther(amount.toFixed(18))
        const reward = {
          amount: rewardAmount,
          tokenId,
          tokenAddr,
          tokenType: ethers.ZeroHash,
        }
        return await this.contract.setRewardOwner(ownerAddress, reward, {
          value: rewardAmount,
        })
      case TokenType.ERC20:
        const token = ERC20__factory.connect(tokenAddr, this.contract.runner)
        const decimals = await token.decimals()
        rewardAmount = ethers.parseUnits(
          amount.toFixed(toNumber(decimals)),
          decimals,
        )
        tokenTypeBytes = ethers.keccak256(toUtf8Bytes('ERC-20'))
        break
      case TokenType.ERC721:
        rewardAmount = BigInt(amount)
        tokenTypeBytes = ethers.keccak256(toUtf8Bytes('ERC-721'))
        break
      case TokenType.ERC1155:
        rewardAmount = BigInt(amount)
        tokenTypeBytes = ethers.keccak256(toUtf8Bytes('ERC-1155'))
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
