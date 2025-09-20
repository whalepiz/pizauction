"use client";

import { BrowserProvider, Contract } from "ethers";
import auctionAbi from "@/abis/FHEAuction.json";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_AUCTION_ADDRESS!;
const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 11155111);

/** Chuyển số → bytes hex (placeholder “mã hoá” để demo) */
function toHex(u8: Uint8Array): string {
  let out = "0x";
  for (let i = 0; i < u8.length; i++) out += u8[i].toString(16).padStart(2, "0");
  return out;
}

export function encryptBidBytes(amountEth: string): string {
  const scaled = Math.floor(Number(amountEth) * 1e6); // 6 chữ số thập phân
  const u8 = new Uint8Array(4);
  u8[0] = (scaled >>> 24) & 0xff;
  u8[1] = (scaled >>> 16) & 0xff;
  u8[2] = (scaled >>> 8) & 0xff;
  u8[3] = scaled & 0xff;
  return toHex(u8);
}

export async function connectWallet() {
  if (!(window as any).ethereum) throw new Error("No wallet found");
  await (window as any).ethereum.request({ method: "eth_requestAccounts" });
  // đảm bảo đúng chain
  const provider = new BrowserProvider((window as any).ethereum);
  const net = await provider.getNetwork();
  if (Number(net.chainId) !== CHAIN_ID) {
    throw new Error(`Wrong network. Switch to chainId ${CHAIN_ID}.`);
  }
}

export async function getAuctionContract() {
  if (!(window as any).ethereum) throw new Error("No wallet found");
  const provider = new BrowserProvider((window as any).ethereum);
  const signer = await provider.getSigner();
  return new Contract(CONTRACT_ADDRESS, auctionAbi as any, signer);
}

export async function placeEncryptedBid(amountEth: string) {
  const contract = await getAuctionContract();
  const enc = encryptBidBytes(amountEth);
  const tx = await contract.placeBid(enc);
  return tx.wait();
}
