import { Interface } from 'ethers/lib/utils'
import { ethers } from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'


function wait(){
  console.log('waiting!...')
  for (let index = 0; index < 10000000000; index++) {
    
  }
  console.log('next!')
}
const { makeInterfaceId } = require('@openzeppelin/test-helpers')


function computeInterfaceId(iface: Interface) {
  return makeInterfaceId.ERC165(
    Object.values(iface.functions).map((frag) => frag.format('sighash')),
  )
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments } = hre
  const { deploy } = deployments
  const { deployer, owner } = await getNamedAccounts()

  const registry = await ethers.getContract('TomoNsRegistry', owner)
  const registrar = await ethers.getContract('BaseRegistrarImplementation', owner)
  const metadata = await ethers.getContract('StaticMetadataService', owner)

  
  await deploy('NameWrapper', {
    from: deployer,
    args: [registry.address, registrar.address, metadata.address],
    log: true,
  })

  const nameWrapper = await ethers.getContract('NameWrapper')

  wait();

  if (owner !== deployer) {
    const tx = await nameWrapper.transferOwnership(owner)
    console.log(`Transferring ownership of NameWrapper to ${owner} (tx: ${tx.hash})...`)
    await tx.wait()
    wait();
  }
  

  const tx2 = await registrar.addController(nameWrapper.address)
  console.log(`Adding NameWrapper as controller on registrar (tx: ${tx2.hash})...`)
  await tx2.wait()
  wait();
  const artifact = await deployments.getArtifact('INameWrapper')
  const interfaceId = computeInterfaceId(new Interface(artifact.abi))
  const resolver = await registry.resolver(ethers.utils.namehash('vic'))
  if (resolver === ethers.constants.AddressZero) {
    console.log(
      `No resolver set for .tomo; not setting interface ${interfaceId} for NameWrapper`,
    )
    return
  }
  const resolverContract = await ethers.getContractAt('OwnedResolver', resolver)
  const tx3 = await resolverContract.setInterface(
    ethers.utils.namehash('vic'),
    interfaceId,
    nameWrapper.address,
  )
  console.log(
    `Setting NameWrapper interface ID ${interfaceId} on .tomo resolver (tx: ${tx3.hash})...`,
  )
  await tx3.wait()

  return true
}

func.id = 'name-wrapper'
func.tags = ['NameWrapper']
func.dependencies = [
  'BaseRegistrarImplementation',
  'StaticMetadataService',
  'TomoNsRegistry',
]

export default func
