import { expect } from "chai";
import { ethers } from "hardhat";
import { parseEther } from "ethers";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

const overrides = { gasLimit: 9999999 };

describe("GachaStation Contract Test", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployGachaStationFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, addr, others] = await ethers.getSigners();

    const GachaStation = await ethers.getContractFactory("GachaStation");
    const ERC20Factory = await ethers.getContractFactory("ERC20T");
    const token = await ERC20Factory.deploy(
      "A8T",
      "A8T",
      parseEther("1000000000000"),
      owner.address,
      overrides
    );
    token.mint(addr.address, parseEther("1000"));
    const station = await GachaStation.deploy(owner.address, overrides);

    return { station, owner, addr, others, token };
  }

  describe("#Deployment", function () {
    it("Should deploy contract successfully & set the right owner", async function () {
      const { station, owner } = await loadFixture(deployGachaStationFixture);
      expect(await station.owner()).to.be.equal(owner.address);
    });
  });

  describe("#SetRewardOwner", function () {
    it("Should only allow the owner to set rewards", async function () {
      const { station, addr, token } = await loadFixture(
        deployGachaStationFixture
      );
      const tokenAddr = await token.getAddress();
      const reward = {
        tokenId: 0,
        tokenAddr,
        amount: 100,
        tokenType: "ERC20",
      };

      await expect(
        station.connect(addr).setRewardOwner(addr.address, reward)
      ).to.be.revertedWithCustomError(station, "OwnableUnauthorizedAccount");
    });

    it("Should set a reward correctly & emit an event", async function () {
      const { station, owner, addr, token } = await loadFixture(
        deployGachaStationFixture
      );

      const tokenAddr = await token.getAddress();
      const reward = {
        tokenId: 0,
        tokenAddr,
        amount: 100,
        tokenType: "ERC20",
      };
      await expect(await station.setRewardOwner(addr.address, reward)).to.emit(
        station,
        "OwnerOf"
      );
      expect(await station.getRewardOwner(0)).to.be.equal(addr.address);
    });
  });

  describe("#ClaimReward", function () {
    it("Should let a user claim a reward", async function () {
      const { station, owner, addr, token } = await loadFixture(
        deployGachaStationFixture
      );

      const tokenAddr = await token.getAddress();
      const reward = {
        tokenId: 0,
        tokenAddr,
        amount: 1,
        tokenType: "ERC20",
      };

      // Set reward
      await station.setRewardOwner(addr.address, reward);
      expect(await station.isClaimed(0)).to.be.equal(false);

      // Claim reward
      const stationAddr = await station.getAddress();
      await token.connect(owner).approve(stationAddr, parseEther("100"));
      const claimTx = await station.connect(addr).claim(0, addr.address);
      await expect(claimTx).to.emit(station, "Claimed");
      expect(await station.isClaimed(0)).to.be.equal(true);
    });

    it("Should fail if a reward is already claimed", async function () {
      const { station, owner, addr, token } = await loadFixture(
        deployGachaStationFixture
      );

      const tokenAddr = await token.getAddress();
      const reward = {
        tokenId: 0,
        tokenAddr,
        amount: 1,
        tokenType: "ERC20",
      };

      // Set reward
      await station.setRewardOwner(addr.address, reward);
      expect(await station.isClaimed(0)).to.be.equal(false);

      // Claim reward
      const stationAddr = await station.getAddress();
      await token.connect(owner).approve(stationAddr, parseEther("100"));
      const tx = await station.connect(addr).claim(0, addr.address);
      await expect(tx).to.emit(station, "Claimed");
      expect(await station.isClaimed(0)).to.be.equal(true);

      // Dupplicate claim
      await expect(
        station.connect(addr).claim(0, addr.address)
      ).to.be.revertedWithCustomError(station, "DupplicatedClaim");
    });

    // TODO: add more tests for others rewards
  });
});
