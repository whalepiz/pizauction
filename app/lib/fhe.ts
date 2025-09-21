"use client";

import {
  BrowserProvider,
  Contract,
  JsonRpcProvider,
  Interface,
  Log,
} from "ethers";
import auctionArtifact from "@/abis/FHEAuction.json";

/** ==== ENV / CONSTANTS ==== */
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_AUCTION_ADDRESS!;
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 11155111);
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;

/** Lấy ABI mảng từ artifact Hardhat (artifact có field .abi) */
const ABI: any = (auctionArtifact as any).abi ?? auctionArtifact;

/** ==== Helpers mã hoá demo (bytes placeholder) ==== */
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

/** ==== Wallet / Contracts ==== */
export async function connectWallet() {
  if (!(window as any).ethereum) throw new Error("No wallet found");
  await (window as any).ethereum.request({ method: "eth_requestAccounts" });

  const provider = new BrowserProvider((window as any).ethereum);
  const net = await provider.getNetwork();
  if (Number(net.chainId) !== CHAIN_ID) {
    throw new Error(`Wrong network. Please switch to chainId ${CHAIN_ID}.`);
  }
}

export async function getAuctionContract() {
  if (!(window as any).ethereum) throw new Error("No wallet found");
  const provider = new BrowserProvider((window as any).ethereum);
  const signer = await provider.getSigner();
  return new Contract(CONTRACT_ADDRESS, ABI, signer);
}

/** Read-only contract (không cần ví) */
function getReadContract() {
  const provider = new JsonRpcProvider(RPC_URL);
  return new Contract(CONTRACT_ADDRESS, ABI, provider);
}

/** Submit bid: bytes “mã hoá” gửi on-chain */
export async function placeEncryptedBid(amountEth: string) {
  const contract = await getAuctionContract();
  const enc = encryptBidBytes(amountEth);
  const tx = await contract.placeBid(enc);
  return tx.wait();
}

/** ==== Trạng thái on-chain: endTime & phase ==== */
export async function readAuctionState() {
  const c = getReadContract();
  const end = Number(await c.endTime()); // seconds
  const now = Math.floor(Date.now() / 1000);
  return {
    endTimeMs: end * 1000,
    phase: (now < end ? "Bidding" : "Closed") as "Bidding" | "Closed",
    now,
  };
}

/** ==== Lịch sử thật từ event BidSubmitted(address,bytes,uint256) ==== */
export async function fetchBidHistory(fromBlock?: number, toBlock?: number) {
  if (!RPC_URL) throw new Error("Missing NEXT_PUBLIC_RPC_URL");
  const provider = new JsonRpcProvider(RPC_URL);

  const iface = new Interface(ABI);
  const fragment = iface.getEvent("BidSubmitted(address,bytes,uint256)");
  if (!fragment) {
    throw new Error("ABI missing event: BidSubmitted(address,bytes,uint256)");
  }
  const topic = fragment.topicHash;

  /** 👇 Lấy block deploy từ ENV để giới hạn phạm vi quét */
  const deployBlock = Number(process.env.NEXT_PUBLIC_DEPLOY_BLOCK || 0);

  const filter = {
    address: CONTRACT_ADDRESS,
    topics: [topic],
    fromBlock: fromBlock ?? deployBlock,   // dùng DEPLOY BLOCK nếu không truyền fromBlock
    toBlock: toBlock ?? "latest",
  };

  const logs: Log[] = await provider.getLogs(filter);

  return logs
    .map((l) => {
      const parsed = iface.parseLog(l);
      if (!parsed) return null; // type-safety
      const bidder: string = parsed.args[0];       // address
      // const enc: string = parsed.args[1];       // bytes (encryptedAmount) - nếu cần show
      const timestamp: bigint = parsed.args[2];    // uint256
      return {
        user: bidder,
        amount: "(encrypted)",
        timeMs: Number(timestamp) * 1000,
      };
    })
    .filter(
      (x): x is { user: string; amount: string; timeMs: number } => x !== null
    )
    .sort((a, b) => b.timeMs - a.timeMs);
}

/** (Tuỳ chọn) Đếm tổng số bid từ event để hiển thị UI */
export async function fetchTotalBids() {
  const history = await fetchBidHistory();
  return history.length;
}
