import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { parseEther } from "ethers";

describe("GachaDeposit", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployGachaDepositFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const GachaDeposit = await ethers.getContractFactory("GachaDeposit");
    const Token = await ethers.getContractFactory("A8ERC20Test");
    const token = await Token.deploy();
    token.mint(otherAccount.address, parseEther("1000"));
    const gacha = await GachaDeposit.deploy();

    return { gacha, owner, otherAccount, token };
  }

  describe("Deployment", function () {
    it("Should deploy contract successfully", async function () {
      const { gacha, owner } = await loadFixture(deployGachaDepositFixture);
    });

    it("Buy ticket with native token", async function () {
      const { gacha, owner } = await loadFixture(deployGachaDepositFixture);

      await gacha.buyTicket(
        "ajalskakjlslkd",
        parseEther("1"),
        ethers.ZeroAddress,
        {
          value: parseEther("1"),
        }
      );

      const ticket = await gacha.userTickets(owner.address, "ajalskakjlslkd");

      expect(ticket[0]).to.equal("ajalskakjlslkd");
    });

    it("Buy ticket with ERC20 token", async function () {
      const { gacha, owner, token, otherAccount } = await loadFixture(
        deployGachaDepositFixture
      );
      const gachaAddress = await gacha.getAddress();
      const amount = parseEther("10");
      await token.connect(otherAccount).approve(gachaAddress, amount);
      const tokenAddress = await token.getAddress();
      await gacha
        .connect(otherAccount)
        .buyTicket("ajalskakjlslkd", amount, tokenAddress);

      const tokenBalance = await token.balanceOf(otherAccount.address);
      console.log("tokenBalance: ", tokenBalance);

      expect(tokenBalance).to.equal(parseEther("1000") - parseEther("10"));
    });

    it("Withdraw native token", async function () {
      const { gacha, owner } = await loadFixture(deployGachaDepositFixture);

      await gacha.buyTicket(
        "ajalskakjlslkd",
        parseEther("1"),
        ethers.ZeroAddress,
        {
          value: parseEther("1"),
        }
      );

      const ticket = await gacha.userTickets(owner.address, "ajalskakjlslkd");

      await gacha.withdraw(ethers.ZeroAddress);

      expect(ticket[0]).to.equal("ajalskakjlslkd");
    });

    it("Withdraw ERC20 token", async function () {
      const { gacha, owner, token, otherAccount } = await loadFixture(
        deployGachaDepositFixture
      );
      const gachaAddress = await gacha.getAddress();
      const amount = parseEther("10");
      await token.connect(otherAccount).approve(gachaAddress, amount);
      const tokenAddress = await token.getAddress();
      await gacha
        .connect(otherAccount)
        .buyTicket("ajalskakjlslkd", amount, tokenAddress);

      const gachaTokenBalance = await token.balanceOf(gachaAddress);
      console.log("gachaTokenBalance erc: ", gachaTokenBalance);
      await gacha.withdraw(tokenAddress);
      const gachaTokenBalanceAfter = await token.balanceOf(gachaAddress);
      console.log("gachaTokenBalanceAfter: ", gachaTokenBalanceAfter);

      // expect(tokenBalance).to.equal(parseEther("1000") - parseEther("10"));
    });

    it("Use ticket", async function () {
      const { gacha, owner, token, otherAccount } = await loadFixture(
        deployGachaDepositFixture
      );
      console.log("ownerss: ", owner.address);
      console.log("otherAddss: ", otherAccount.address);
      const gachaAddress = await gacha.getAddress();
      const amount = parseEther("10");
      await token.connect(otherAccount).approve(gachaAddress, amount);
      const tokenAddress = await token.getAddress();
      await gacha
        .connect(otherAccount)
        .buyTicket("ajalskakjlslkd", amount, tokenAddress);

      await gacha.connect(otherAccount).useTicket("ajalskakjlslkd");

      const ticket = await gacha.userTickets(
        otherAccount.address,
        "ajalskakjlslkd"
      );

      expect(ticket[3]).to.equal(true);
    });
  });
});
