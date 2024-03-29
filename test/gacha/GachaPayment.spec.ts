import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { parseEther } from 'ethers'

describe('GachaPayment', function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployGachaPaymentFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners()

    const GachaPayment = await ethers.getContractFactory('GachaPayment')
    const Token = await ethers.getContractFactory('TestERC20')
    const token = await Token.deploy(owner.address)
    token.mint(otherAccount.address, parseEther('1000'))
    const gacha = await GachaPayment.deploy(parseEther('0.001'))

    return { gacha, owner, otherAccount, token }
  }

  describe('#Deployment', function () {
    it('Should deploy contract successfully', async function () {
      const [owner, otherAccount] = await ethers.getSigners()

      const GachaPayment = await ethers.getContractFactory('GachaPayment')
      const Token = await ethers.getContractFactory('TestERC20')
      const token = await Token.deploy(owner.address)
      token.mint(otherAccount.address, parseEther('1000'))
      const gacha = await GachaPayment.deploy(parseEther('0.001'))

      expect(await gacha.getAddress()).to.be.match(/^0x[a-fA-F0-9]{40}$/)
    })
  })

  describe('#setFee', function () {
    it('Should set fee successfully ', async function () {
      const { gacha } = await loadFixture(deployGachaPaymentFixture)

      await gacha.setFee(parseEther('0.001'))

      const fee = await gacha.fee()

      expect(fee).to.equal(parseEther('0.001'))
    })

    it('Should set fee unsuccessfully ', async function () {
      const { gacha } = await loadFixture(deployGachaPaymentFixture)

      try {
        await gacha.setFee(parseEther('-111'))
      } catch {}

      const fee = await gacha.fee()
      expect(fee).to.equal(parseEther('0.001'))
    })
  })

  describe('#buyTicket', function () {
    it('Should buy ticket with native token successfully', async function () {
      const { gacha } = await loadFixture(deployGachaPaymentFixture)

      await expect(
        gacha.buyTicket(
          '651e1ca6e496c0a956de8d91',
          parseEther('1'),
          ethers.ZeroAddress,
          {
            value: parseEther('1') + parseEther('0.001'),
          },
        ),
      ).to.changeEtherBalance(gacha, parseEther('1') + parseEther('0.001'))

      await expect(
        gacha.buyTicket(
          '651e1ca6e496c0a956de8d91',
          parseEther('1'),
          ethers.ZeroAddress,
          {
            value: parseEther('1') + parseEther('0.001'),
          },
        ),
      ).to.emit(gacha, 'BuyTicket')
    })

    it('Should buy ticket with ERC20 token successfully', async function () {
      const { gacha, token, otherAccount } = await loadFixture(
        deployGachaPaymentFixture,
      )
      const gachaAddress = await gacha.getAddress()
      const amount = parseEther('10')
      await token.connect(otherAccount).approve(gachaAddress, amount)
      const tokenAddress = await token.getAddress()

      await expect(
        gacha
          .connect(otherAccount)
          .buyTicket('651e1ca6e496c0a956de8d91', amount, tokenAddress, {
            value: parseEther('0.001'),
          }),
      ).to.changeEtherBalance(gacha, parseEther('0.001'))
    })

    it('Should Buy ticket with native token unsuccessfully', async function () {
      const { gacha } = await loadFixture(deployGachaPaymentFixture)

      await expect(
        gacha.buyTicket(
          '651e1ca6e496c0a956de8d91',
          parseEther('1'),
          ethers.ZeroAddress,
          {
            value: parseEther('0.1'),
          },
        ),
      ).to.revertedWith('Payment is not valid!')
    })

    it('Should buy ticket with ERC20 token unsuccessfully', async function () {
      const { gacha, token, otherAccount } = await loadFixture(
        deployGachaPaymentFixture,
      )
      const gachaAddress = await gacha.getAddress()
      const amount = parseEther('-10')
      const tokenAddress = await token.getAddress()
      try {
        await token.connect(otherAccount).approve(gachaAddress, amount)

        await gacha
          .connect(otherAccount)
          .buyTicket('651e1ca6e496c0a956de8d91', amount, tokenAddress)
      } catch {}

      const tokenBalance = await token.balanceOf(gacha)

      expect(tokenBalance).to.equal(parseEther('0'))
    })
  })

  describe('#withdraw', function () {
    it('Should withdraw native token successfully', async function () {
      const { gacha } = await loadFixture(deployGachaPaymentFixture)

      await gacha.buyTicket(
        '651e1ca6e496c0a956de8d91',
        parseEther('1'),
        ethers.ZeroAddress,
        {
          value: parseEther('1') + parseEther('0.001'),
        },
      )

      await expect(gacha.withdraw(ethers.ZeroAddress)).to.changeEtherBalance(
        gacha,
        -(parseEther('1') + parseEther('0.001')),
      )
    })

    it('Should withdraw ERC20 token successfully', async function () {
      const { gacha, token, otherAccount } = await loadFixture(
        deployGachaPaymentFixture,
      )
      const gachaAddress = await gacha.getAddress()
      const amount = parseEther('10')
      await token.connect(otherAccount).approve(gachaAddress, amount)
      const tokenAddress = await token.getAddress()
      await gacha
        .connect(otherAccount)
        .buyTicket('651e1ca6e496c0a956de8d91', amount, tokenAddress, {
          value: parseEther('0.001'),
        })

      await gacha.withdraw(tokenAddress)
    })

    it('Should withdraw native token unsuccessfully', async function () {
      const { gacha, otherAccount } = await loadFixture(
        deployGachaPaymentFixture,
      )

      await gacha.buyTicket(
        '651e1ca6e496c0a956de8d91',
        parseEther('1'),
        ethers.ZeroAddress,
        {
          value: parseEther('1') + parseEther('0.001'),
        },
      )
      await expect(gacha.connect(otherAccount).withdraw(ethers.ZeroAddress)).to
        .reverted
    })

    it('Should withdraw ERC20 token unsuccessfully', async function () {
      const { gacha, token, otherAccount } = await loadFixture(
        deployGachaPaymentFixture,
      )
      const gachaAddress = await gacha.getAddress()
      const amount = parseEther('10')
      await token.connect(otherAccount).approve(gachaAddress, amount)
      const tokenAddress = await token.getAddress()
      await gacha
        .connect(otherAccount)
        .buyTicket('651e1ca6e496c0a956de8d91', amount, tokenAddress, {
          value: parseEther('0.001'),
        })

      await expect(gacha.connect(otherAccount).withdraw(tokenAddress)).to
        .reverted
    })
  })
})
