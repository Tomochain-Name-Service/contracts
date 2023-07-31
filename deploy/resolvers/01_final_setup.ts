import { namehash } from 'ethers/lib/utils'
import { ethers, network } from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { keccak256 } from 'js-sha3'
import { DeploymentsExtension } from "hardhat-deploy/types";
const { makeInterfaceId } = require('@openzeppelin/test-helpers')

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function wait(){
  console.log('waiting!...')
  for (let index = 0; index < 10000000000; index++) {
    
  }
  console.log('next!')
}

const utils = ethers.utils;
const labelhash = (name: string) => utils.keccak256(utils.toUtf8Bytes(name))

async function computeInterfaceId(deployments: DeploymentsExtension, name: string) {
  const artifact = await deployments.getArtifact(name);
  const iface = new utils.Interface(artifact.abi);

  return makeInterfaceId.ERC165(
    Object.values(iface.functions).map((frag) => frag.format('sighash')),
  )
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));


const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments } = hre
  const { owner } = await getNamedAccounts()

  const registry = await ethers.getContract('TomoNsRegistry', owner)
  const root = await ethers.getContract('Root', owner);
  const registrar = await ethers.getContract('BaseRegistrarImplementation', owner)
  const nameWrapper = await ethers.getContract('NameWrapper', owner)
  const controller = await ethers.getContract('ETHRegistrarController', owner)
  const resolver = await ethers.getContract('PublicResolver', owner)

  const tx1 = await registrar.setResolver(resolver.address)
  console.log(`Setting resolver for .tomo to PublicResolver (tx: ${tx1.hash})...`)
  await tx1.wait()

  wait();

  const ownerOfResolver = await registry.owner(namehash('resolver'))
  if (ownerOfResolver == ZERO_ADDRESS) {
    const tx = await root.setSubnodeOwner('0x' + keccak256('resolver'), owner)
    console.log(`Setting owner of resolver.tomo to owner on registry (tx: ${tx.hash})...`)
    await tx.wait()
    wait()
  } else if (ownerOfResolver != owner) {
    console.log('resolver.tomo is not owned by the owner address, not setting resolver')
    return
  }

  const tx2 = await registry.setResolver(namehash('resolver'), resolver.address)
  console.log(`Setting resolver for resolver.tomo to PublicResolver (tx: ${tx2.hash})...`)
  await tx2.wait()
  wait();

  const tx3 = await resolver['setAddr(bytes32,address)'](namehash('resolver'), resolver.address)
  console.log(`Setting address for resolver.tomo to PublicResolver (tx: ${tx3.hash})...`)
  await tx3.wait()
  wait();

  // const providerWithTomoNs = new ethers.providers.StaticJsonRpcProvider(
  //   network.name === 'mainnet' ? 'https://rpc.tomochain.com' : 'https://rpc.testnet.tomochain.com',
  //   { chainId: 89, name: 'testnet', ensAddress: registry.address },
  // )

  // const resolverAddr = await providerWithTomoNs.getResolver('tomo')
  // if (resolverAddr === null) {
  //   console.log('No resolver set for .tomo not setting interface')
  //   return
  // }

  const tx4 = await root.setSubnodeOwner('0x' + keccak256('tomo'), owner)
  console.log(`Temporarily setting owner of tomo to owner  (tx: ${tx4.hash})...`)
  await tx4.wait()
  wait();

  const iNameWrapper = await computeInterfaceId(deployments, 'NameWrapper') 
  const tx5 = await resolver.setInterface(namehash('tomo'), iNameWrapper, nameWrapper.address)
  console.log(`Setting NameWrapper interface ID ${iNameWrapper} on .tomo resolver (tx: ${tx5.hash})...`)
  await tx5.wait()
  wait()

  const iRegistrarController = await computeInterfaceId(deployments, 'IETHRegistrarController')
  const tx6 = await resolver.setInterface(namehash('tomo'), iRegistrarController, controller.address)
  console.log(`Setting IETHRegistrarController interface ID ${iRegistrarController} on .tomo resolver (tx: ${tx6.hash})...`)
  await tx6.wait()
  wait();

  const iBulkRenewal = await computeInterfaceId(deployments, 'IBulkRenewal')
  const tx7 = await resolver.setInterface(namehash('tomo'), iBulkRenewal, controller.address)
  console.log(`Setting BulkRenewal interface ID ${iBulkRenewal} on .tomo resolver (tx: ${tx7.hash})...`)
  await tx7.wait()
  wait()

  const tx8 = await root.setSubnodeOwner('0x' + keccak256('tomo'), registrar.address)
  console.log(`Set owner of tomo back to registrar (tx: ${tx8.hash})...`)
  await tx8.wait();
  wait();

  return true
}

func.id = 'final-setup'
func.tags = ['FinalSetup']
func.dependencies = [
  'TomoNsRegistry',
  'BaseRegistrarImplementation',
  'NameWrapper',
  'ETHRegistrarController',
  'PublicResolver',
]

export default func
