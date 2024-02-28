import {
  ContractRunner,
  ethers,
  parseEther,
  parseUnits,
  toNumber,
} from 'ethers'

import {
  ERC20__factory,
  GachaPayment,
  GachaPayment__factory,
} from '../typechain'

export class GachaPaymentSDK {
  public readonly contract: GachaPayment

  constructor(contractAddress: string, runner: ContractRunner) {
    this.contract = GachaPayment__factory.connect(contractAddress, runner)
  }

  async setFee(fee: number) {
    return await this.contract.setFee(parseEther(fee.toFixed(18)))
  }

  async buyTicket(
    orderId: string,
    amount: number,
    tokenAddress: string = ethers.ZeroAddress,
  ) {
    let decimalizedAmount = parseEther(amount.toFixed(18))
    const fee = await this.contract.fee()
    let nativeValue = fee + parseEther(amount.toFixed(18))

    if (tokenAddress !== ethers.ZeroAddress) {
      nativeValue = fee
      const erc20 = ERC20__factory.connect(tokenAddress, this.contract.runner)
      const decimals = (await erc20.decimals()) || 0
      decimalizedAmount = parseUnits(
        amount.toFixed(toNumber(decimals)),
        decimals,
      )
    }

    return await this.contract.buyTicket(
      orderId,
      decimalizedAmount,
      tokenAddress,
      {
        value: nativeValue,
      },
    )
  }

  async withdraw(tokenAddress: string = ethers.ZeroAddress) {
    return await this.contract.withdraw(tokenAddress)
  }
}
