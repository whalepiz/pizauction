import { ethers } from "hardhat";

async function main() {
  const Auction = await ethers.getContractFactory("FHEAuction");
  const auction = await Auction.deploy("Rare NFT", 60 * 60); // đấu giá 1h
  await auction.waitForDeployment();
  console.log("FHEAuction deployed to:", await auction.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
