import { ethers } from "hardhat";

async function main() {
  const Factory = await ethers.getContractFactory("AuctionFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();

  console.log("AuctionFactory deployed to:", await factory.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
