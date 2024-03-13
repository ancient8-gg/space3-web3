import { ethers, ContractRunner, toUtf8Bytes, toNumber } from 'ethers'
import {
  ERC20__factory,
  GachaStation,
  GachaStation__factory,
} from '../typechain'
import { PayableOverrides } from '../typechain/common'

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
    const { reward, overrides } = await this.standardize(
      amount,
      tokenId,
      tokenAddr,
      tokenType,
    )
    return await this.contract.setRewardOwner.populateTransaction(
      ownerAddress,
      reward,
      overrides,
    )
  }

  private async standardize(
    amount: number,
    tokenId: number,
    tokenAddr: string,
    tokenType: TokenType,
  ) {
    let txAmount = 0n
    let txTokenType: string
    const overrides: PayableOverrides = {}

    switch (tokenType) {
      case TokenType.NATIVE:
        txAmount = ethers.parseEther(amount.toFixed(18))
        txTokenType = ethers.ZeroHash
        overrides.value = txAmount
        break
      case TokenType.ERC20:
        const token = ERC20__factory.connect(tokenAddr, this.contract.runner)
        const decimals = await token.decimals()
        txAmount = ethers.parseUnits(
          amount.toFixed(toNumber(decimals)),
          decimals,
        )
        txTokenType = ethers.keccak256(toUtf8Bytes('ERC-20'))
        break
      case TokenType.ERC721:
        txAmount = BigInt(amount)
        txTokenType = ethers.keccak256(toUtf8Bytes('ERC-721'))
        break
      case TokenType.ERC1155:
        txAmount = BigInt(amount)
        txTokenType = ethers.keccak256(toUtf8Bytes('ERC-1155'))
        break
      default:
        throw new Error('Unsupported token type')
    }

    return {
      reward: { amount: txAmount, tokenId, tokenAddr, tokenType: txTokenType },
      overrides,
    }
  }
}
