import packet from 'dns-packet'
import { ethers } from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'



function wait(){
  console.log('waiting!...')
  for (let index = 0; index < 10000000000; index++) {
    
  }
  console.log('next!')
}


const realAnchors = [
  {
    name: '.',
    type: 'DS',
    class: 'IN',
    ttl: 3600,
    data: {
      keyTag: 19036,
      algorithm: 8,
      digestType: 2,
      digest: new Buffer(
        '49AAC11D7B6F6446702E54A1607371607A1A41855200FD2CE1CDDE32F24E8FB5',
        'hex',
      ),
    },
  },
  {
    name: '.',
    type: 'DS',
    klass: 'IN',
    ttl: 3600,
    data: {
      keyTag: 20326,
      algorithm: 8,
      digestType: 2,
      digest: new Buffer(
        'E06D44B80B8F1D39A95C0B0D7C65D08458E880409BBC683457104237C7F8EC8D',
        'hex',
      ),
    },
  },
]

const dummyAnchor = {
  name: '.',
  type: 'DS',
  class: 'IN',
  ttl: 3600,
  data: {
    keyTag: 1278, // Empty body, flags == 0x0101, algorithm = 253, body = 0x0000
    algorithm: 253,
    digestType: 253,
    digest: new Buffer('', 'hex'),
  },
}

function encodeAnchors(anchors: any[]) {
  return (
    '0x' +
    anchors
      .map((anchor) => {
        return packet.answer.encode(anchor).toString('hex')
      })
      .join('')
  )
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments, network } = hre
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  const anchors = realAnchors.slice()
  let algorithms: Record<number, string> = {
    5: 'RSASHA1Algorithm',
    7: 'RSASHA1Algorithm',
    8: 'RSASHA256Algorithm',
    13: 'P256SHA256Algorithm',
  }
  const digests: Record<number, string> = {
    1: 'SHA1Digest',
    2: 'SHA256Digest',
  }

  if (network.tags.test) {
    anchors.push(dummyAnchor)
    algorithms[253] = 'DummyAlgorithm'
    algorithms[254] = 'DummyAlgorithm'
    digests[253] = 'DummyDigest'
  }

  await deploy('DNSSECImpl', {
    from: deployer,
    args: [encodeAnchors(anchors)],
    log: true,
  })
  const dnssec = await ethers.getContract('DNSSECImpl')
  wait();
  const transactions = []
  for (const [id, alg] of Object.entries(algorithms)) {
    const address = (await deployments.get(alg)).address
    if (address != (await dnssec.algorithms(id))) {
      const tx = await dnssec.setAlgorithm(id, address)
      await tx.wait()
      wait();
    }
  }

  for (const [id, digest] of Object.entries(digests)) {
    const address = (await deployments.get(digest)).address
    if (address != (await dnssec.digests(id))) {
      const tx = await dnssec.setDigest(id, address)
      await tx.wait();
      wait();
    }
  }

  // console.log(
  //   `Waiting on ${transactions.length} transactions setting DNSSEC parameters`,
  // )
  // await Promise.all(transactions.map((tx) => tx.wait()))

  return true
}

func.id = 'dnssec-oracle'
func.tags = ['DNSSecOracle']
func.dependencies = ['DNSSecAlgorithm', 'DNSSecDigest']

export default func
