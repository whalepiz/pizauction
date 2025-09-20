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
/** Chuyển Uint8Array -> 0x...hex */
function toHex(u8: Uint8Array): string {
  let out = "0x";
  for (let i = 0; i < u8.length; i++) out += u8[i].toString(16).padStart(2, "0");
  return out;
}

/** “Mã hoá” demo: scale số ETH rồi đóng gói 4 byte (placeholder) */
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

/** Submit bid: bytes “mã hoá” gửi on-chain */
export async function placeEncryptedBid(amountEth: string) {
  const contract = await getAuctionContract();
  const enc = encryptBidBytes(amountEth);
  const tx = await contract.placeBid(enc);
  return tx.wait();
}

/** ==== Đọc lịch sử thật từ on-chain qua event BidSubmitted ==== */
/** Trả về mảng: { user, amount: "(encrypted)", timeMs } mới nhất trước */
export async function fetchBidHistory(fromBlock?: number, toBlock?: number) {
  if (!RPC_URL) throw new Error("Missing NEXT_PUBLIC_RPC_URL");
  const provider = new JsonRpcProvider(RPC_URL);

  // Dùng Interface để tạo topic & parse log
  const iface = new Interface(ABI);
  // event BidSubmitted(address bidder, bytes encryptedAmount, uint256 timestamp)
  const topic = iface.getEventTopic("BidSubmitted");

  const filter = {
    address: CONTRACT_ADDRESS,
    topics: [topic],
    fromBlock: (fromBlock ?? 0) as any,
    toBlock: (toBlock ?? "latest") as any,
  };

  const logs: Log[] = await provider.getLogs(filter);

  return logs
    .map((l) => {
      const parsed = iface.parseLog(l);
      const bidder: string = parsed.args.bidder;
      const timestamp: bigint = parsed.args.timestamp; // uint256
      // const enc: string = parsed.args.encryptedAmount; // nếu muốn hiển thị
      return {
        user: bidder,
        amount: "(encrypted)",
        timeMs: Number(timestamp) * 1000,
      };
    })
    .sort((a, b) => b.timeMs - a.timeMs);
}
