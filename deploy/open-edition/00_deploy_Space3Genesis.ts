import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { DateTime } from 'luxon'

const func: DeployFunction = async function ({
  getNamedAccounts,
  deployments,
  run,
}: HardhatRuntimeEnvironment) {
  const { deployer } = await getNamedAccounts()
  const { deploy } = deployments
  const tokenUri = process.env.SPACE3_GENESIS_TOKEN_URI || ''
  const startTime = DateTime.fromISO(
    process.env.SPACE3_GENESIS_START_DATE || '',
  ).toUnixInteger()
  const endTime = DateTime.fromISO(
    process.env.SPACE3_GENESIS_END_DATE || '',
  ).toUnixInteger()

  const { address } = await deploy('Space3Genesis', {
    from: deployer,
    args: [tokenUri, startTime, endTime],
  })
  await run('verify:verify', {
    address,
    constructorArguments: [tokenUri, startTime, endTime],
  })
}
func.id = 'space3_genesis'
func.tags = ['Space3Genesis', 'open_edition']

export default func
