import { parseEther } from 'ethers'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments } = hre
  const { deploy } = deployments
  const accounts = await getNamedAccounts()
  const { deployer } = accounts

  await deploy('GachaPayment', {
    from: deployer,
    args: [parseEther('0.01')],
    log: true,
  })
}

func.id = 'gacha-payment'
func.tags = ['GachaPayment', 'v1']
func.dependencies = []

export default func
