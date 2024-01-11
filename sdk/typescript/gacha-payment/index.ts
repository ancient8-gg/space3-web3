import { ContractRunner, ethers, parseEther, parseUnits } from "ethers";

import { GachaPayment, GachaPayment__factory } from "../typechain";
import { ERC20_ABI } from "./erc20.abi";

export class Space3GenesisSDK {
  public readonly contract: GachaPayment;

  constructor(contractAddress: string, runner: ContractRunner) {
    this.contract = GachaPayment__factory.connect(contractAddress, runner);
  }

  async setFee(fee: number) {
    return await this.contract.setFee(parseEther(`${fee}`));
  }

  async buyTicket(
    orderId: string,
    amount: number,
    tokenAddress: string = ethers.ZeroAddress
  ) {
    let decimalizedAmount = parseEther(`${amount}`);
    let fee = await this.contract.fee();
    let nativeValue = fee + parseEther(`${amount}`);

    if (tokenAddress) {
      nativeValue = fee;
      const erc20 = new ethers.Contract(
        tokenAddress,
        ERC20_ABI,
        this.contract.runner
      );
      const decimals = (await erc20.decimals()) || 0;
      decimalizedAmount = parseUnits(`${amount}`, decimals);
    }

    return await this.contract.buyTicket(
      orderId,
      decimalizedAmount,
      tokenAddress,
      {
        value: nativeValue,
      }
    );
  }

  async withdraw(tokenAddress: string = ethers.ZeroAddress) {
    return await this.contract.withdraw(tokenAddress);
  }
}
