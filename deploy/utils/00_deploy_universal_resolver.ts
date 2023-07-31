import { ethers } from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

function wait(){
  console.log('waiting!...')
  for (let index = 0; index < 10000000000; index++) {
    
  }
  console.log('next!')
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments } = hre
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  const registry = await ethers.getContract('TomoNsRegistry')

  await deploy('UniversalResolver', {
    from: deployer,
    args: [registry.address],
    log: true,
  })

  return true
}

func.id = 'universal-resolver'
func.tags = [ 'UniversalResolver']
func.dependencies = []

export default func
