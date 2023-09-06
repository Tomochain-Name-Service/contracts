import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { ethers } from 'hardhat'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments } = hre
  const { deploy } = deployments
  const { deployer, owner } = await getNamedAccounts()

  const deployArgs = {
    from: deployer,
    args: [],
    log: true,
  }
  const ethOwnedResolver = await deploy('OwnedResolver', deployArgs)

  if (!ethOwnedResolver.newlyDeployed) return

  const registry = await ethers.getContract('TomoNsRegistry', owner)
  const registrar = await ethers.getContract(
    'BaseRegistrarImplementation',
    owner,
  )

  const tx = await registrar.setResolver(ethOwnedResolver.address)
  await tx.wait()

  const resolver = await registry.resolver(ethers.utils.namehash('tomo'))
  console.log(`set resolver for .tomo to ${resolver}`)
  if (!ethOwnedResolver.newlyDeployed) return
}

func.id = 'eth-owned-resolver'
func.tags = ['resolvers', 'OwnedResolver', 'EthOwnedResolver']
func.dependencies = ['TomoNsRegistry']

export default func