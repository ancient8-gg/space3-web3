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
    const gacha = await GachaDeposit.deploy();

    return { gacha, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should deploy contract successfully", async function () {
      const { gacha, owner } = await loadFixture(deployGachaDepositFixture);
    });

    it("Should init the first game", async function () {
      const { gacha } = await loadFixture(deployGachaDepositFixture);
      const game = await gacha.initGame("1232321", "mongodb", 1);

      console.log("gacha.games: ", await gacha.games(0));

      expect((await gacha.games(0)).fee).to.equal(1);
    });

    it("Should reject the game initiation", async function () {
      const { gacha, otherAccount } = await loadFixture(
        deployGachaDepositFixture
      );
      const game = console.log("gacha.games: ", await gacha.games(0));

      await gacha.connect(otherAccount).initGame("1232321", "mongodb", 1);
    });

    it("Should receive and store the funds to lock", async function () {
      const { gacha, owner } = await loadFixture(deployGachaDepositFixture);

      const gameId = await gacha.initGame(
        "1232321",
        "mongodb",
        parseEther("1")
      );

      await gacha.buyTicket(0, { value: parseEther("1") });

      expect((await gacha.userTickets(owner.address, 0)).gameId).to.equal(0n);
    });

    it("Should close game", async function () {
      const { gacha, owner } = await loadFixture(deployGachaDepositFixture);

      const gameId = await gacha.initGame(
        "1232321",
        "mongodb",
        parseEther("1")
      );

      await gacha.closeGame(0);

      expect((await gacha.games(0)).isEnded).to.equal(true);
    });
  });
});
