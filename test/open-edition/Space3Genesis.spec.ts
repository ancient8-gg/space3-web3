import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import { DateTime } from 'luxon'

describe('Space3Genesis', () => {
  const nftUri = 'http://mock_uri.com/nft.img'

  async function deployFixture() {
    const [owner] = await ethers.getSigners()
    return {
      owner,
    }
  }

  describe('#Deployment', () => {
    it('Should deploy successfully', async () => {
      const { owner } = await loadFixture(deployFixture)
      const startDate = DateTime.fromISO(
        '2024-01-09T00:00:00.000Z',
      ).toUnixInteger()
      const endDate = DateTime.fromISO(
        '2024-01-10T00:00:00.000Z',
      ).toUnixInteger()
      const space3Genesis = await ethers.deployContract(
        'Space3Genesis',
        [nftUri, startDate, endDate],
        {
          signer: owner,
        },
      )
      await space3Genesis.waitForDeployment()
      expect(await space3Genesis.getAddress()).to.be.match(
        /^0x[a-fA-F0-9]{40}$/,
      )
    })

    it('Should fail to deploy', async () => {
      const { owner } = await loadFixture(deployFixture)
      const startDate = DateTime.fromISO(
        '2024-01-10T00:00:00.000Z',
      ).toUnixInteger()
      const endDate = DateTime.fromISO(
        '2024-01-09T00:00:00.000Z',
      ).toUnixInteger()
      expect(
        ethers.deployContract('Space3Genesis', [nftUri, startDate, endDate], {
          signer: owner,
        }),
      ).to.be.revertedWith('Invalid public mint period')
    })
  })

  describe('#safeMint', () => {
    it('Should mint successfully', async () => {
      const { owner } = await loadFixture(deployFixture)
      const startDate = DateTime.now().toUnixInteger() - 1
      const endDate = DateTime.now().toUnixInteger() + 100
      const space3Genesis = await ethers.deployContract(
        'Space3Genesis',
        [nftUri, startDate, endDate],
        {
          signer: owner,
        },
      )
      await space3Genesis.waitForDeployment()
      const tokenId = await space3Genesis.nextTokenId()
      await space3Genesis.safeMint(owner.address)
      expect(await space3Genesis.ownerOf(tokenId)).to.be.equal(owner.address)
    })

    it('Should allow multiple mint', async () => {
      const { owner } = await loadFixture(deployFixture)
      const startDate = DateTime.now().toUnixInteger() - 1
      const endDate = DateTime.now().toUnixInteger() + 100
      const space3Genesis = await ethers.deployContract(
        'Space3Genesis',
        [nftUri, startDate, endDate],
        {
          signer: owner,
        },
      )
      await space3Genesis.waitForDeployment()
      const ownedTokenIds = []
      for (let i = 0; i < 4; i++) {
        const tokenId = await space3Genesis.nextTokenId()
        await space3Genesis.safeMint(owner.address)
        ownedTokenIds.push(tokenId)
      }
      for (const tokenId of ownedTokenIds) {
        expect(await space3Genesis.ownerOf(tokenId)).to.be.equal(owner.address)
      }
    })

    it('Should fail to mint before public mint period', async () => {
      const { owner } = await loadFixture(deployFixture)
      const startDate = DateTime.now().toUnixInteger() + 24 * 60
      const endDate = DateTime.now().toUnixInteger() + 2 * 24 * 60
      const space3Genesis = await ethers.deployContract(
        'Space3Genesis',
        [nftUri, startDate, endDate],
        {
          signer: owner,
        },
      )
      await space3Genesis.waitForDeployment()
      expect(space3Genesis.safeMint(owner.address)).to.be.revertedWith(
        'Not in public mint period',
      )
    })

    it('Should fail to mint after public mint period', async () => {
      const { owner } = await loadFixture(deployFixture)
      const startDate = DateTime.now().toUnixInteger() - 2 * 24 * 60
      const endDate = DateTime.now().toUnixInteger() - 24 * 60
      const space3Genesis = await ethers.deployContract(
        'Space3Genesis',
        [nftUri, startDate, endDate],
        {
          signer: owner,
        },
      )
      await space3Genesis.waitForDeployment()
      expect(space3Genesis.safeMint(owner.address)).to.be.revertedWith(
        'Not in public mint period',
      )
    })
  })

  describe('#tokenURI', () => {
    it('Should be the same token URI', async () => {
      const { owner } = await loadFixture(deployFixture)
      const startDate = DateTime.now().toUnixInteger() - 1
      const endDate = DateTime.now().toUnixInteger() + 100
      const space3Genesis = await ethers.deployContract(
        'Space3Genesis',
        [nftUri, startDate, endDate],
        {
          signer: owner,
        },
      )
      await space3Genesis.waitForDeployment()
      const tokenId = await space3Genesis.nextTokenId()
      await space3Genesis.safeMint(owner.address)
      expect(await space3Genesis.tokenURI(tokenId)).to.be.equal(nftUri)
    })
  })
})
