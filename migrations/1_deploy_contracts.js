const {
  deployProxy,
  upgradeProxy,
  forceImport,
} = require("@openzeppelin/truffle-upgrades");
const { deploy } = require("@openzeppelin/truffle-upgrades/dist/utils");

const Space3 = artifacts.require("Space3");

module.exports = async function (deployer, network, accounts) {
  if (network === "bscTestnet") {
    const Space3ProxyAddress = "0x4effD4C719ceC87b35AEdfe06837E27331080A2F"; //V1
    const Space3Contract = "0x33DF8Cb8eE46fe8B5048bc65d82b795E71606A1C"; //v2
    // await deployProxy(Space3, [], { deployer, kind: "uups" });
    await deployer.deploy(Space3);

    // await forceImport(Space3ProxyAddress, Space3);
    // await upgradeProxy(Space3ProxyAddress, Space3, { deployer, kind: 'uups', unsafeAllowRenames: true });
  } else if (network === "bsc") {
    // const Space3ProxyAddress = "0x4effD4C719ceC87b35AEdfe06837E27331080A2F";
    // await deployProxy(Space3, [], { deployer, kind: "uups" });

    await deployer.deploy(Space3);

    // await forceImport(Space3ProxyAddress, Space3);
    // await upgradeProxy(Space3ProxyAddress, Space3, { deployer, kind: 'uups', unsafeAllowRenames: true });
  } else if (network === "roninTestnet") {
    await deployer.deploy(Space3);
  }
};
