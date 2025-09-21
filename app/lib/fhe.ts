"use client";

import {
  BrowserProvider,
  Contract,
  Interface,
  JsonRpcProvider,
  Log
} from "ethers";
import factoryArtifact from "@/abis/AuctionFactory.json";
import auctionArtifact from "@/abis/FHEAuction.json";
import { saveAuctionImage, getAuctionImage } from "./imageStore";

/** ==== ENV ==== */
export const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS!;
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 11155111);
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;

/** ==== ABIs ==== */
const FACTORY_ABI: any = (factoryArtifact as any).abi ?? factoryArtifact;
const AUCTION_ABI: any = (auctionArtifact as any).abi ?? auctionArtifact;

/** ==== Wallet helpers ==== */
export async function ensureWallet(chainId = CHAIN_ID) {
  if (!(window as any).ethereum) throw new Error("No wallet found");
  await (window as any).ethereum.request({ method: "eth_requestAccounts" });
  const provider = new BrowserProvider((window as any).ethereum);
  const net = await provider.getNetwork();
  if (Number(net.chainId) !== chainId) {
    throw new Error(`Wrong network. Please switch to chainId ${chainId}.`);
  }
  return provider;
}
// alias để nút Connect hoạt động
export const connectWallet = ensureWallet;

/** ==== Read provider ==== */
function readProvider() {
  return new JsonRpcProvider(RPC_URL);
}

/** ==== Contracts ==== */
export async function getFactoryWithSigner() {
  const provider = await ensureWallet();
  const signer = await provider.getSigner();
  return new Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);
}
export function getFactoryRead() {
  return new Contract(FACTORY_ADDRESS, FACTORY_ABI, readProvider());
}
export async function getAuctionWithSigner(addr: string) {
  const provider = await ensureWallet();
  const signer = await provider.getSigner();
  return new Contract(addr, AUCTION_ABI, signer);
}
export function getAuctionRead(addr: string) {
  return new Contract(addr, AUCTION_ABI, readProvider());
}

/** ==== Encode “encrypted” bid (placeholder) ==== */
function toHex(u8: Uint8Array): string {
  let out = "0x";
  for (let i = 0; i < u8.length; i++) out += u8[i].toString(16).padStart(2, "0");
  return out;
}
export function encodeBid(amountEth: string): string {
  const scaled = Math.floor(Number(amountEth) * 1e6);
  const u8 = new Uint8Array(4);
  u8[0] = (scaled >>> 24) & 0xff;
  u8[1] = (scaled >>> 16) & 0xff;
  u8[2] = (scaled >>> 8) & 0xff;
  u8[3] = scaled & 0xff;
  return toHex(u8);
}

/** ==== Create auction on-chain via Factory ==== */
export async function createAuctionOnChain(
  title: string,
  durationHours: number,
  imageUrl: string,
): Promise<{ address: string; endTime: number; item: string }> {
  const factory = await getFactoryWithSigner();
  const seconds = Math.max(1, Math.floor(durationHours * 3600));
  const tx = await factory.createAuction(title, seconds);
  const receipt = await tx.wait();

  const iface = new Interface(FACTORY_ABI);
  const evt = iface.getEvent("AuctionCreated(address,string,uint256,address)");
  const topic = evt!.topicHash;

  let created = { address: "", endTime: 0, item: title };
  (receipt?.logs || []).forEach((l: any) => {
    try {
      if (l.topics?.[0] === topic) {
        const parsed = iface.parseLog(l as Log)!;
        created = {
          address: (parsed.args[0] as string),
          item: (parsed.args[1] as string),
          endTime: Number(parsed.args[2])
        };
      }
    } catch {}
  });

  if (!created.address) throw new Error("Create failed: no event parsed");

  // lưu image cục bộ để hiển thị
  if (imageUrl) saveAuctionImage(created.address, imageUrl);

  return created;
}

/** ==== Load auctions from chain ==== */
export type OnchainAuction = {
  address: string;
  item: string;
  endTimeMs: number;
  title?: string;
  imageUrl?: string;
  description?: string; // tạm thời không có nguồn để populate
};

export async function fetchAuctionsFromChain(): Promise<OnchainAuction[]> {
  const factory = getFactoryRead();
  const addrs: string[] = await factory.getAllAuctions();
  const provider = readProvider();

  const calls = addrs.map(async (addr) => {
    const c = new Contract(addr, AUCTION_ABI, provider);
    const item: string = await c.item();
    const endTime: bigint = await c.endTime();
    const imageUrl = getAuctionImage(addr);
    return {
      address: addr,
      item,
      endTimeMs: Number(endTime) * 1000,
      title: item,
      imageUrl,
    };
  });

  return (await Promise.all(calls)).sort((a, b) => a.endTimeMs - b.endTimeMs);
}

/** ==== Bid per-auction ==== */
export async function bidOnAuction(addr: string, amountEth: string) {
  const c = await getAuctionWithSigner(addr);
  const enc = encodeBid(amountEth);
  const tx = await c.placeBid(enc);
  return tx.wait();
}

/** ==== Bid history (per contract OR default env) ==== */
/** Đọc event BidSubmitted(address,bytes,uint256) từ một auction cụ thể.
 *  Nếu không truyền address, dùng NEXT_PUBLIC_AUCTION_ADDRESS.
 *  Tự giảm phạm vi quét (mặc định 20k blocks gần nhất) để tránh timeout RPC.
 */
 /** ==== Bid history (per contract OR default env) ==== */
export async function fetchBidHistory(
  fromBlock?: number,
  toBlock?: number,
  address?: string
): Promise<{ user: string; amount: string; timeMs: number }[]> {
  const provider = new JsonRpcProvider(RPC_URL);
  const iface = new Interface(AUCTION_ABI);
  const frag = iface.getEvent("BidSubmitted(address,bytes,uint256)");
  if (!frag) return [];

  const topic0 = frag.topicHash;
  const target =
    address ?? (process.env.NEXT_PUBLIC_AUCTION_ADDRESS as string | undefined);
  if (!target) return [];

  const latest = await provider.getBlockNumber();
  const to = toBlock ?? latest;
  const from = fromBlock ?? Math.max(0, to - 20_000); // quét 20k block gần nhất

  const logs: Log[] = await provider.getLogs({
    address: target,
    topics: [topic0],
    fromBlock: from as any,
    toBlock: to as any,
  });

  const rows = logs
    .map((l) => {
      try {
        const parsed = iface.parseLog(l as any);
        if (!parsed) return null; // 👈 fix thêm check null
        const bidder: string = parsed.args[0];
        const ts: number = Number(parsed.args[2]);
        return { user: bidder, amount: "(encrypted)", timeMs: ts * 1000 };
      } catch {
        return null;
      }
    })
    .filter((x): x is { user: string; amount: string; timeMs: number } => !!x)
    .sort((a, b) => b.timeMs - a.timeMs);

  return rows;
}
