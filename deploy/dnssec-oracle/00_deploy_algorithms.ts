import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

function wait(){
  console.log('waiting!...')
  for (let index = 0; index < 10000000000; index++) {
    
  }
  console.log('next!')
}
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments, network } = hre
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  await deploy('RSASHA1Algorithm', {
    from: deployer,
    args: [],
    log: true,
  })
  wait();
  await deploy('RSASHA256Algorithm', {
    from: deployer,
    args: [],
    log: true,
  })
  wait()
  await deploy('P256SHA256Algorithm', {
    from: deployer,
    args: [],
    log: true,
  })
  wait()

  if (network.tags.test) {
    await deploy('DummyAlgorithm', {
      from: deployer,
      args: [],
      log: true,
    })
  }
  wait();

  return true
}

func.id = 'dnssec-algorithms'
func.tags = ['DNSSecAlgorithm']

export default func
