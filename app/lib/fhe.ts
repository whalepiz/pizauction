code cũ đây bạn tự thay cho mình sao chép : "use client";

import {
  BrowserProvider,
  Contract,
  Interface,
  JsonRpcProvider,
  Log
} from "ethers";
import factoryArtifact from "@/abis/AuctionFactory.json";
import auctionArtifact from "@/abis/FHEAuction.json";
import { saveAuctionImage } from "./imageStore";

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

/** ==== Create auction on-chain ==== */
export async function createAuctionOnChain(
  title: string,
  durationHours: number,
  imageUrl: string
): Promise<{ address: string; endTime: number; item: string }> {
  const factory = await getFactoryWithSigner();
  const seconds = Math.max(1, Math.floor(durationHours * 3600));
  const tx = await factory.createAuction(title, seconds);
  const receipt = await tx.wait();

  // Parse event AuctionCreated
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

  // Lưu image local để hiển thị đẹp
  saveAuctionImage(created.address, imageUrl);

  return created;
}

/** ==== Load auctions from chain ==== */
export type OnchainAuction = {
  address: string;
  item: string;
  endTimeMs: number;
  imageUrl?: string;
};

export async function fetchAuctionsFromChain(): Promise<OnchainAuction[]> {
  const factory = getFactoryRead();
  const addrs: string[] = await factory.getAllAuctions();
  const provider = readProvider();

  // Đọc song song item & endTime từ từng auction
  const calls = addrs.map(async (addr) => {
    const c = new Contract(addr, AUCTION_ABI, provider);
    const item: string = await c.item();
    const endTime: bigint = await c.endTime();
    return {
      address: addr,
      item,
      endTimeMs: Number(endTime) * 1000
    };
  });

  const list = await Promise.all(calls);

  // Gắn imageUrl đã lưu (nếu có)
  const { getAuctionImage } = await import("./imageStore");
  return list.map((x) => ({ ...x, imageUrl: getAuctionImage(x.address) }));
}

/** ==== Bidding per-auction ==== */
/** Chuyển số → bytes hex đơn giản (placeholder “mã hóa”). */
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

export async function bidOnAuction(addr: string, amountEth: string) {
  const c = await getAuctionWithSigner(addr);
  const enc = encodeBid(amountEth);
  const tx = await c.placeBid(enc);
  return tx.wait();
}
