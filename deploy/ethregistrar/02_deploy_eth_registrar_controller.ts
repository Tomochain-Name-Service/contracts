import { Interface } from 'ethers/lib/utils'
import { ethers } from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const { makeInterfaceId } = require('@openzeppelin/test-helpers')

function computeInterfaceId(iface: Interface) {
  return makeInterfaceId.ERC165(
    Object.values(iface.functions).map((frag) => frag.format('sighash')),
  )
}

function wait(){
  console.log('waiting!...')
  for (let index = 0; index < 10000000000; index++) {
    
  }
  console.log('next!')
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments } = hre
  const { deploy } = deployments
  const { deployer, owner } = await getNamedAccounts()

  const registrar = await ethers.getContract('BaseRegistrarImplementation', owner)
  const priceOracle = await ethers.getContract('ExponentialPremiumPriceOracle', owner)
  const reverseRegistrar = await ethers.getContract('ReverseRegistrar', owner)
  const nameWrapper = await ethers.getContract('NameWrapper', owner)
  const registry = await ethers.getContract('TomoNsRegistry', owner)

  const deployArgs = {
    from: deployer,
    args: [
      registrar.address,
      priceOracle.address,
      60,
      86400,
      reverseRegistrar.address,
      nameWrapper.address,
      registry.address
    ],
    log: true,
  }
  await deploy('ETHRegistrarController', deployArgs)

  const controller = await ethers.getContract('ETHRegistrarController')

  wait();

  if (owner !== deployer) {
    const tx = await controller.transferOwnership(owner)
    console.log(`Transferring ownership of ETHRegistrarController to ${owner} (tx: ${tx.hash})...`)
    await tx.wait()
    wait();
  }

  console.log('WRAPPER OWNER', await nameWrapper.owner(), await nameWrapper.signer.getAddress())

  const tx1 = await nameWrapper.setController(controller.address, true)
  console.log(`Adding ETHRegistrarController as a controller of NameWrapper (tx: ${tx1.hash})...`)
  await tx1.wait()
  wait();

  const tx2 = await reverseRegistrar.setController(controller.address, true)
  console.log(`Adding ETHRegistrarController as a controller of ReverseRegistrar (tx: ${tx2.hash})...`)
  await tx2.wait()
  wait();

  const artifact = await deployments.getArtifact('IETHRegistrarController')
  const interfaceId = computeInterfaceId(new Interface(artifact.abi))

  const resolver = await registry.resolver(ethers.utils.namehash('vic'))

  if (resolver === ethers.constants.AddressZero) {
    console.log(
      `No resolver set for .tomo; not setting interface ${interfaceId} for ETH Registrar Controller`,
    )
    return
  }

  const resolverContract = await ethers.getContractAt('OwnedResolver', resolver)
  const tx3 = await resolverContract.setInterface(
    ethers.utils.namehash('vic'),
    interfaceId,
    controller.address,
  )
  console.log(
    `Setting ETHRegistrarController interface ID ${interfaceId} on .tomo resolver (tx: ${tx3.hash})...`,
  )
  await tx3.wait()

  // const tx3 = await registrar.addController(controller.address)
  // console.log(`Adding controller as controller on registrar (tx: ${tx3.hash})...`)
  // await tx3.wait()

  return true
}

func.id = 'eth-registrar'
func.tags = ['ETHRegistrarController']
func.dependencies = [
  'TomoNsRegistry',
  'BaseRegistrarImplementation',
  'ExponentialPremiumPriceOracle',
  'ReverseRegistrar',
  'NameWrapper',
  'OwnedResolver',
]

export default func
