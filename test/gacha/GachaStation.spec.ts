import { expect } from 'chai'
import { ethers } from 'hardhat'
import { parseEther, keccak256, toUtf8Bytes } from 'ethers'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'

describe('GachaStation', function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployGachaStationFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, wallet0, others] = await ethers.getSigners()

    // Setup ERC20
    const ERC20Factory = await ethers.getContractFactory('ERC20T')
    const erc20Token = await ERC20Factory.deploy(
      'A8T',
      'A8T',
      parseEther('1000000000'),
      owner.address,
    )
    erc20Token.mint(wallet0.address, parseEther('1000'))

    // Setup ERC721
    const ERC721Factory = await ethers.getContractFactory('ERC721T')
    const erc721Token = await ERC721Factory.deploy('A8NFT', 'A8NFT', owner)
    await erc721Token.safeMint(owner.address)

    // Setup ERC1155
    const ERC1155Factory = await ethers.getContractFactory('ERC1155T')
    const erc1155Token = await ERC1155Factory.deploy('A8NFT', owner)
    await erc1155Token.connect(owner).mint(owner.address, 1, 100, '0x')

    // Setup GachaStation contract
    const GachaStation = await ethers.getContractFactory('GachaStation')
    const station = await GachaStation.deploy(owner.address)

    return {
      station,
      owner,
      wallet0,
      others,
      erc20Token,
      erc721Token,
      erc1155Token,
    }
  }

  describe('#Deployment', function () {
    it('Should deploy contract successfully & set the right owner', async function () {
      const { station } = await loadFixture(deployGachaStationFixture)
      expect(await station.getAddress()).to.be.match(/^0x[a-fA-F0-9]{40}$/)
    })
  })

  describe('#deposit', function () {
    it('Should allow depositing native token', async function () {
      const { station, wallet0 } = await loadFixture(deployGachaStationFixture)

      // Deposit Ether
      const amount = parseEther('1')
      await expect(() =>
        station.connect(wallet0).deposit({ value: amount }),
      ).to.changeEtherBalance(station, amount)

      // Verify balance in the contract
      const contractBalance = await ethers.provider.getBalance(station)
      expect(contractBalance).to.equal(amount)
    })

    it('Should allow depositing ERC20 tokens', async function () {
      const { station, wallet0, erc20Token } = await loadFixture(
        deployGachaStationFixture,
      )

      // Approve and deposit ERC20 tokens
      const depositAmount = parseEther('10')
      await erc20Token.connect(wallet0).approve(station, depositAmount)
      await expect(
        station.connect(wallet0).depositERC20(erc20Token, depositAmount),
      )
        .to.emit(station, 'TokenDeposited')
        .withArgs(wallet0.address, erc20Token, 0, depositAmount)

      // Verify balance in the contract
      const contractBalance = await erc20Token.balanceOf(station)
      expect(contractBalance).to.equal(depositAmount)
    })

    it('Should allow depositing ERC721 tokens', async function () {
      const { station, owner, erc721Token } = await loadFixture(
        deployGachaStationFixture,
      )

      // Approve GachaStation contract to transfer the ERC721 token
      await erc721Token.connect(owner).approve(station, 0)

      // Deposit the ERC721 token into the GachaStation
      await expect(await station.connect(owner).depositERC721(erc721Token, 0))
        .to.emit(station, 'TokenDeposited')
        .withArgs(owner.address, erc721Token, 0, 1)

      // Verify the GachaStation contract is now the owner of the ERC721 token
      expect(await erc721Token.ownerOf(0)).to.equal(station)
    })

    it('Should allow depositing ERC1155 tokens', async function () {
      const { station, owner, erc1155Token } = await loadFixture(
        deployGachaStationFixture,
      )

      // Approve GachaStation contract to transfer the ERC1155 token
      await erc1155Token.connect(owner).setApprovalForAll(station, true)

      // Deposit the ERC1155 token into the GachaStation
      await expect(station.connect(owner).depositERC1155(erc1155Token, 1, 1))
        .to.emit(station, 'TokenDeposited')
        .withArgs(owner.address, erc1155Token, 1, 1)

      // Verify the GachaStation contract holds the correct amount of the ERC1155 token
      const balance = await erc1155Token.balanceOf(station, 1)
      expect(balance).to.equal(1)
    })

    it('Should fail to deposit ERC721 due to insufficient approval', async function () {
      const { station, owner, erc721Token } = await loadFixture(
        deployGachaStationFixture,
      )

      await expect(
        station.connect(owner).depositERC721(erc721Token, 0),
      ).to.be.revertedWithCustomError(erc721Token, 'ERC721InsufficientApproval')
    })

    it('Should fail to deposit ERC1155 due to insufficient balance', async function () {
      const { station, owner, erc1155Token } = await loadFixture(
        deployGachaStationFixture,
      )
      await erc1155Token.connect(owner).mint(owner.address, 2, 100, '0x')
      await erc1155Token.connect(owner).setApprovalForAll(station, true)
      await expect(
        station.connect(owner).depositERC1155(erc1155Token, 0, 200),
      ).to.be.revertedWithCustomError(
        erc1155Token,
        'ERC1155InsufficientBalance',
      )
    })
  })

  describe('#setRewardOwner', function () {
    it('Should only allow the admin to set rewards', async function () {
      const { station, wallet0, erc20Token } = await loadFixture(
        deployGachaStationFixture,
      )
      const tokenAddr = await erc20Token.getAddress()
      const reward = {
        tokenId: 0,
        tokenAddr,
        amount: 100,
        tokenType: keccak256(toUtf8Bytes('ERC20')),
      }

      await expect(
        station.connect(wallet0).setRewardOwner(wallet0.address, reward),
      ).to.be.revertedWithCustomError(
        station,
        'AccessControlUnauthorizedAccount',
      )
    })

    it('Should set a reward correctly & emit an event', async function () {
      const { station, wallet0, erc20Token } = await loadFixture(
        deployGachaStationFixture,
      )

      const tokenAddr = await erc20Token.getAddress()
      const reward = {
        tokenId: 0,
        tokenAddr,
        amount: 100,
        tokenType: keccak256(toUtf8Bytes('ERC20')),
      }
      await expect(await station.setRewardOwner(wallet0.address, reward))
        .to.emit(station, 'OwnershipGranted')
        .withArgs(0, wallet0.address)
      expect(await station.getRewardOwner(0)).to.be.equal(wallet0.address)
    })

    it('Should allow the admin to set ERC721 rewards successfully', async function () {
      const { station, wallet0, erc721Token } = await loadFixture(
        deployGachaStationFixture,
      )
      const tokenAddr = await erc721Token.getAddress()
      const reward = {
        tokenId: 0,
        tokenAddr,
        amount: 1,
        tokenType: keccak256(toUtf8Bytes('ERC721')),
      }

      await expect(await station.setRewardOwner(wallet0.address, reward))
        .to.emit(station, 'OwnershipGranted')
        .withArgs(0, wallet0.address)
      expect(await station.getRewardOwner(0)).to.be.equal(wallet0.address)
    })

    it('Should allow the admin to set ERC1155 rewards successfully', async function () {
      const { station, wallet0, erc1155Token } = await loadFixture(
        deployGachaStationFixture,
      )
      const tokenAddr = await erc1155Token.getAddress()
      const reward = {
        tokenId: 0,
        tokenAddr,
        amount: 1,
        tokenType: keccak256(toUtf8Bytes('ERC1155')),
      }

      await expect(await station.setRewardOwner(wallet0.address, reward))
        .to.emit(station, 'OwnershipGranted')
        .withArgs(0, wallet0.address)
      expect(await station.getRewardOwner(0)).to.be.equal(wallet0.address)
    })
  })

  describe('#claim', function () {
    it('Should let a user claim a ECR20 reward', async function () {
      const { station, owner, wallet0, erc20Token } = await loadFixture(
        deployGachaStationFixture,
      )

      const tokenAddr = await erc20Token.getAddress()
      const reward = {
        tokenId: 0,
        tokenAddr,
        amount: 1,
        tokenType: keccak256(toUtf8Bytes('ERC20')),
      }
      // Deposit resources
      const amount = parseEther('1')
      await erc20Token.connect(owner).approve(station, amount)
      await station.connect(owner).depositERC20(erc20Token, amount)

      // Set reward
      await station.setRewardOwner(wallet0.address, reward)
      expect(await station.isClaimed(0)).to.be.equal(false)

      // Claim reward
      const claimTx = await station.connect(wallet0).claim(0, wallet0.address)
      await expect(claimTx).to.emit(station, 'Claimed')
      expect(await station.isClaimed(0)).to.be.equal(true)
      expect(await station.getRewardOwner(0)).to.be.equal(wallet0.address)
    })

    it('Should let a user claim a ERC721 reward', async function () {
      const { station, owner, wallet0, erc721Token } = await loadFixture(
        deployGachaStationFixture,
      )

      const tokenAddr = await erc721Token.getAddress()
      const reward = {
        tokenId: 0,
        tokenAddr,
        amount: 1,
        tokenType: keccak256(toUtf8Bytes('ERC721')),
      }
      // Deposit resources to the contract
      await erc721Token.connect(owner).approve(station, 0)
      await station.connect(owner).depositERC721(erc721Token, 0)

      // Set reward
      await station.setRewardOwner(wallet0.address, reward)
      expect(await station.isClaimed(0)).to.be.equal(false)

      // Claim reward
      const claimTx = await station.connect(wallet0).claim(0, wallet0.address)
      await expect(claimTx).to.emit(station, 'Claimed')
      expect(await station.isClaimed(0)).to.be.equal(true)
      expect(await station.getRewardOwner(0)).to.be.equal(wallet0.address)
    })

    it('Should let a user claim a ERC1155 reward', async function () {
      const { station, owner, wallet0, erc1155Token } = await loadFixture(
        deployGachaStationFixture,
      )

      const tokenAddr = await erc1155Token.getAddress()
      const reward = {
        tokenId: 1,
        tokenAddr,
        amount: 1,
        tokenType: keccak256(toUtf8Bytes('ERC1155')),
      }
      // Deposit resources to the contract
      await erc1155Token.connect(owner).setApprovalForAll(station, true)
      await station.connect(owner).depositERC1155(erc1155Token, 1, 1)

      // Set reward
      await station.setRewardOwner(wallet0.address, reward)
      expect(await station.isClaimed(0)).to.be.equal(false)

      // Claim reward
      const claimTx = await station.connect(wallet0).claim(0, wallet0.address)
      await expect(claimTx).to.emit(station, 'Claimed')
      expect(await station.isClaimed(0)).to.be.equal(true)
      expect(await station.getRewardOwner(0)).to.be.equal(wallet0.address)
    })

    it('Should fail if a reward is already claimed', async function () {
      const { station, owner, wallet0, erc20Token } = await loadFixture(
        deployGachaStationFixture,
      )

      const tokenAddr = await erc20Token.getAddress()
      const reward = {
        tokenId: 0,
        tokenAddr,
        amount: 1,
        tokenType: keccak256(toUtf8Bytes('ERC20')),
      }

      // Deposit resources
      const amount = parseEther('1')
      await erc20Token.connect(owner).approve(station, amount)
      await station.connect(owner).depositERC20(erc20Token, amount)

      // Set reward
      await station.setRewardOwner(wallet0.address, reward)
      expect(await station.isClaimed(0)).to.be.equal(false)

      // Claim reward
      const stationAddr = await station.getAddress()
      await erc20Token.connect(owner).approve(stationAddr, parseEther('100'))
      const tx = await station.connect(wallet0).claim(0, wallet0.address)
      await expect(tx).to.emit(station, 'Claimed')
      expect(await station.isClaimed(0)).to.be.equal(true)

      // Dupplicate claim
      await expect(
        station.connect(wallet0).claim(0, wallet0.address),
      ).to.be.revertedWithCustomError(station, 'AlreadyClaimed')
    })
  })
})
