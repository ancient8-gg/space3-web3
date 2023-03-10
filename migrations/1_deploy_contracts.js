const {
  deployProxy,
  upgradeProxy,
  forceImport,
} = require("@openzeppelin/truffle-upgrades");

const Space3 = artifacts.require("Space3");

module.exports = async function (deployer, network, accounts) {
  if (network === "bscTestnet") {
    const Space3ProxyAddress = "0x4effD4C719ceC87b35AEdfe06837E27331080A2F";
    await deployProxy(Space3, [], { deployer, kind: "uups" });
    // await forceImport(Space3ProxyAddress, Space3);
    // await upgradeProxy(Space3ProxyAddress, Space3, { deployer, kind: 'uups', unsafeAllowRenames: true });
  } else if (network === "bsc") {
    // const Space3ProxyAddress = "0x4effD4C719ceC87b35AEdfe06837E27331080A2F";
    await deployProxy(Space3, [], { deployer, kind: "uups" });
    // await forceImport(Space3ProxyAddress, Space3);
    // await upgradeProxy(Space3ProxyAddress, Space3, { deployer, kind: 'uups', unsafeAllowRenames: true });
  }
};
