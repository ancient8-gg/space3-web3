import { parseEther } from 'ethers'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments, run } = hre
  const { deploy } = deployments
  const accounts = await getNamedAccounts()
  const { deployer } = accounts

  const { address } = await deploy('GachaPayment', {
    from: deployer,
    args: [parseEther('0.0')],
    log: true,
  })

  await run('verify:verify', {
    address,
    constructorArguments: [parseEther('0.0')],
  })
}

func.id = 'gacha_payment'
func.tags = ['GachaPayment', 'v1', 'gacha']
func.dependencies = []

export default func
