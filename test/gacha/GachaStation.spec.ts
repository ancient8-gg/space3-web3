import { expect } from 'chai'
import { ethers } from 'hardhat'
import {
  parseEther,
  keccak256,
  toUtf8Bytes,
  parseUnits,
  ZeroAddress,
  ZeroHash,
} from 'ethers'
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
    erc20Token.mint(owner.address, parseEther('1000'))

    // Setup ERC721
    const ERC721Factory = await ethers.getContractFactory('ERC721T')
    const erc721Token = await ERC721Factory.deploy('A8NFT', 'A8NFT', owner)
    await erc721Token.safeMint(owner.address, 0)

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
        tokenType: keccak256(toUtf8Bytes('ERC-20')),
      }

      await expect(
        station.connect(wallet0).setRewardOwner(wallet0.address, reward),
      ).to.be.revertedWithCustomError(
        station,
        'AccessControlUnauthorizedAccount',
      )
    })

    it('Should allow the admin to set Native token rewards successfully', async function () {
      const { station, wallet0 } = await loadFixture(deployGachaStationFixture)
      const txAmount = parseEther('1')
      const reward = {
        tokenId: 0,
        tokenAddr: ZeroAddress,
        amount: txAmount,
        tokenType: ZeroHash,
      }

      // process to set reward
      await expect(
        await station.setRewardOwner(wallet0.address, reward, {
          value: txAmount,
        }),
      )
        .to.emit(station, 'OwnershipGranted')
        .withArgs(0, wallet0.address)

      expect(await ethers.provider.getBalance(station)).to.be.equal(txAmount)
      expect(await station.getRewardOwner(0)).to.be.equal(wallet0.address)
    })

    it('Should allow the admin to set ERC-20 rewards successfully', async function () {
      const { station, owner, wallet0, erc20Token } = await loadFixture(
        deployGachaStationFixture,
      )

      const tokenAddr = await erc20Token.getAddress()
      const tokenDecimals = await erc20Token.decimals()
      const txAmount = parseUnits('1', tokenDecimals)
      const reward = {
        tokenId: 0,
        tokenAddr,
        amount: txAmount,
        tokenType: keccak256(toUtf8Bytes('ERC-20')),
      }

      // pre-test
      await erc20Token.connect(owner).approve(station, txAmount)

      // process to set reward
      await expect(await station.setRewardOwner(wallet0.address, reward))
        .to.emit(station, 'OwnershipGranted')
        .withArgs(0, wallet0.address)

      expect(await erc20Token.balanceOf(station)).to.be.equal(txAmount)
      expect(await station.getRewardOwner(0)).to.be.equal(wallet0.address)
    })

    it('Should allow the admin to set ERC-721 rewards successfully', async function () {
      const { station, owner, wallet0, erc721Token } = await loadFixture(
        deployGachaStationFixture,
      )
      const tokenAddr = await erc721Token.getAddress()
      const reward = {
        tokenId: 0,
        tokenAddr,
        amount: 1,
        tokenType: keccak256(toUtf8Bytes('ERC-721')),
      }

      // pre-test
      await erc721Token.connect(owner).approve(station, 0)

      // process to set reward
      await expect(await station.setRewardOwner(wallet0.address, reward))
        .to.emit(station, 'OwnershipGranted')
        .withArgs(0, wallet0.address)
      expect(await erc721Token.balanceOf(station)).to.be.equal(1)
      expect(await station.getRewardOwner(0)).to.be.equal(wallet0.address)
    })

    it('Should allow the admin to set ERC-1155 rewards successfully', async function () {
      const { station, owner, wallet0, erc1155Token } = await loadFixture(
        deployGachaStationFixture,
      )
      const tokenAddr = await erc1155Token.getAddress()
      const reward = {
        tokenId: 1,
        tokenAddr,
        amount: 1,
        tokenType: keccak256(toUtf8Bytes('ERC-1155')),
      }
      // pre-test
      await erc1155Token.connect(owner).setApprovalForAll(station, true)

      // process to set reward
      await expect(await station.setRewardOwner(wallet0.address, reward))
        .to.emit(station, 'OwnershipGranted')
        .withArgs(0, wallet0.address)
      expect(await erc1155Token.balanceOf(station, 1)).to.be.equal(1)
      expect(await station.getRewardOwner(0)).to.be.equal(wallet0.address)
    })

    it('Should fail to set reward Native token due to insufficient balance', async function () {
      const { station, owner, wallet0 } = await loadFixture(
        deployGachaStationFixture,
      )
      const adminBalance = await ethers.provider.getBalance(owner)
      const txAmount = adminBalance + 100n
      const reward = {
        tokenId: 0,
        tokenAddr: ZeroAddress,
        amount: txAmount,
        tokenType: ZeroHash,
      }

      // process to set reward
      await expect(
        station.setRewardOwner(wallet0.address, reward, {
          value: txAmount,
        }),
      ).to.be.rejectedWith("sender doesn't have enough funds to send tx")
    })

    it('Should fail to set reward ERC-20 due to insufficient balance', async function () {
      const { station, owner, wallet0, erc20Token } = await loadFixture(
        deployGachaStationFixture,
      )

      const tokenAddr = await erc20Token.getAddress()
      const txAmount = parseEther('10000000000')
      const reward = {
        tokenId: 0,
        tokenAddr,
        amount: txAmount,
        tokenType: keccak256(toUtf8Bytes('ERC-20')),
      }

      // pre-test
      await erc20Token.connect(owner).approve(station, txAmount)

      // process to set reward
      await expect(
        station.setRewardOwner(wallet0.address, reward),
      ).to.be.revertedWithCustomError(erc20Token, 'ERC20InsufficientBalance')
    })

    it('Should fail to set reward ERC-721 due to admin have no that token', async function () {
      const { station, owner, wallet0, erc721Token } = await loadFixture(
        deployGachaStationFixture,
      )
      const tokenAddr = await erc721Token.getAddress()
      const txTokenId = 100
      const reward = {
        tokenId: txTokenId,
        tokenAddr,
        amount: 1,
        tokenType: keccak256(toUtf8Bytes('ERC-721')),
      }

      // pre-test
      await erc721Token.connect(owner).safeMint(wallet0.address, txTokenId)

      // process to set reward
      expect(
        erc721Token.connect(owner).approve(station, txTokenId),
      ).to.be.revertedWithCustomError(erc721Token, 'ERC721InvalidApprover')
      expect(
        station.setRewardOwner(wallet0.address, reward),
      ).to.be.revertedWithCustomError(erc721Token, 'ERC721InsufficientApproval')
    })

    it('Should fail to set reward ERC-1155 due to admin have no that token', async function () {
      const { station, owner, wallet0, erc1155Token } = await loadFixture(
        deployGachaStationFixture,
      )
      const tokenAddr = await erc1155Token.getAddress()
      const txTokenId = 100
      const reward = {
        tokenId: txTokenId,
        tokenAddr,
        amount: 1,
        tokenType: keccak256(toUtf8Bytes('ERC-1155')),
      }

      // pre-test
      await erc1155Token
        .connect(owner)
        .mint(wallet0.address, txTokenId, 10, '0x')

      // process to set reward
      expect(
        erc1155Token.connect(owner).setApprovalForAll(station, true),
      ).to.be.revertedWithCustomError(erc1155Token, 'ERC1155InvalidApprover')
      expect(station.setRewardOwner(wallet0.address, reward)).to.be.reverted
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
        tokenType: keccak256(toUtf8Bytes('ERC-20')),
      }
      // Deposit resources
      const amount = parseEther('1')
      await erc20Token.connect(owner).approve(station, amount)

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
        tokenType: keccak256(toUtf8Bytes('ERC-721')),
      }
      // Deposit resources to the contract
      await erc721Token.connect(owner).approve(station, 0)

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
        tokenType: keccak256(toUtf8Bytes('ERC-1155')),
      }
      // Deposit resources to the contract
      await erc1155Token.connect(owner).setApprovalForAll(station, true)

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
        tokenType: keccak256(toUtf8Bytes('ERC-20')),
      }

      // Deposit resources
      const amount = parseEther('1')
      await erc20Token.connect(owner).approve(station, amount)

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

  describe('#withdraw', function () {
    it('Should let admin withdraw ether', async function () {
      const { station, owner } = await loadFixture(deployGachaStationFixture)
      // Deposit resources
      const amount = parseEther('1')
      await owner.sendTransaction({ to: station, value: amount })

      await expect(station.connect(owner).withdraw(amount)).changeEtherBalances(
        [station, owner],
        [-amount, amount],
      )
    })

    it('Should not let other addresses withdraw ether', async function () {
      const { station, owner, others } = await loadFixture(
        deployGachaStationFixture,
      )
      const amount = parseEther('1')
      await owner.sendTransaction({ to: station, value: amount })
      await expect(station.connect(others).withdraw(amount)).to.be.reverted
    })

    it('Should let admin withdraw ERC20', async function () {
      const { station, owner, erc20Token } = await loadFixture(
        deployGachaStationFixture,
      )
      // Deposit resources
      const decimals = await erc20Token.decimals()
      const amount = parseUnits('1', decimals)
      await erc20Token.connect(owner).transfer(station, amount)

      await expect(
        station.connect(owner).withdrawERC20(erc20Token, amount),
      ).changeTokenBalances(erc20Token, [station, owner], [-amount, amount])
    })

    it('Should not let other addresses withdraw ERC20', async function () {
      const { station, owner, erc20Token, others } = await loadFixture(
        deployGachaStationFixture,
      )
      // Deposit resources
      const decimals = await erc20Token.decimals()
      const amount = parseUnits('1', decimals)
      await erc20Token.connect(owner).transfer(station, amount)
      await expect(station.connect(others).withdraw(amount)).to.be.reverted
    })

    it('Should let admin withdraw ERC721', async function () {
      const { station, owner, erc721Token } = await loadFixture(
        deployGachaStationFixture,
      )
      // Deposit resources
      await erc721Token.connect(owner).transferFrom(owner, station, 0)

      await expect(
        station.connect(owner).withdrawERC721(erc721Token, 0),
      ).changeTokenBalances(erc721Token, [station, owner], [-1, 1])
    })

    it('Should not let other addresses withdraw ERC721', async function () {
      const { station, erc721Token, others, owner } = await loadFixture(
        deployGachaStationFixture,
      )
      // Deposit resources

      await erc721Token.connect(owner).transferFrom(owner, station, 0)
      await expect(station.connect(others).withdrawERC721(erc721Token, 0)).to.be
        .reverted
    })

    it('Should let admin withdraw ERC1155', async function () {
      const { station, owner, erc1155Token } = await loadFixture(
        deployGachaStationFixture,
      )
      // Deposit resources
      await erc1155Token
        .connect(owner)
        .safeTransferFrom(owner, station, 1, 10, '0x')
      const tx = await station
        .connect(owner)
        .withdrawERC1155(erc1155Token, 1, 10)
      const ownerBalance = await erc1155Token.balanceOf(owner, 1)
      const stationBalance = await erc1155Token.balanceOf(station, 1)

      expect(ownerBalance).to.eql(100n)
      expect(stationBalance).to.eql(0n)
    })

    it('Should not let other addresses withdraw ERC1155', async function () {
      const { station, owner, others, erc1155Token } = await loadFixture(
        deployGachaStationFixture,
      )
      // Deposit resources
      await erc1155Token
        .connect(owner)
        .safeTransferFrom(owner, station, 1, 10, '0x')

      await expect(station.connect(others).withdrawERC1155(erc1155Token, 1, 10))
        .to.be.reverted
    })
  })
})
