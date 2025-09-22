import { ethers } from "hardhat";

async function main() {
  const Factory = await ethers.getContractFactory("MetadataRegistry");
  const registry = await Factory.deploy();
  await registry.waitForDeployment();
  console.log("MetadataRegistry deployed to:", await registry.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
