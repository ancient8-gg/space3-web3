import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const func: DeployFunction = async function ({
  getNamedAccounts,
  deployments,
  run,
}: HardhatRuntimeEnvironment) {
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  const { address } = await deploy('GachaStation', {
    from: deployer,
    args: [deployer],
    log: true,
  })

  await run('verify:verify', {
    address,
    constructorArguments: [deployer],
  })
}

func.id = 'gacha_station'
func.tags = ['GachaStation', 'gacha_station']

export default func
