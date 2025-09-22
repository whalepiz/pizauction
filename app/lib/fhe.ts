"use client";

import {
  BrowserProvider,
  Contract,
  JsonRpcProvider,
  Interface,
} from "ethers";
import factoryArtifact from "@/abis/AuctionFactory.json";
import auctionArtifact from "@/abis/FHEAuction.json";
import { saveAuctionMeta, getAuctionMeta, getAuctionImage } from "./imageStore";

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

/** ==== Create auction via Factory ==== */
export async function createAuctionOnChain(
  title: string,
  durationHours: number,
  imageUrl: string,
  description?: string
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
        const parsed = iface.parseLog(l as any)!;
        const args = (parsed as any).args;
        created = {
          address: String(args[0]),
          item: String(args[1]),
          endTime: Number(args[2]),
        };
      }
    } catch {}
  });

  if (!created.address) throw new Error("Create failed: no event parsed");

  // lưu metadata cục bộ (tiêu đề/ảnh/mô tả)
  saveAuctionMeta(created.address, { title, imageUrl, description });

  return created;
}

/** ==== Types ==== */
export type OnchainAuction = {
  address: string;
  item: string;
  endTimeMs: number;
  title?: string;
  imageUrl?: string;
  description?: string;
};

/** ==== Bid / Reveal / Finalize per-auction ==== */
export async function bidOnAuction(addr: string, amountEth: string) {
  const c = await getAuctionWithSigner(addr);
  const enc = encodeBid(amountEth);
  const tx = await c.placeBid(enc);
  return tx.wait();
}

export async function revealOnAuction(addr: string, clearAmount: string) {
  // clearAmount là số nguyên/decimal (ETH) – để demo ta scale 1e6 về uint64
  const val = Math.floor(Number(clearAmount) * 1e6);
  if (val < 0) throw new Error("Invalid amount");
  const c = await getAuctionWithSigner(addr);
  const tx = await c.revealBid(val);
  return tx.wait();
}

export async function finalizeAuction(addr: string) {
  const c = await getAuctionWithSigner(addr);
  const tx = await c.finalize();
  return tx.wait();
}

export async function readPhase(addr: string): Promise<"Bidding" | "Reveal" | "Closed"> {
  const c = getAuctionRead(addr);
  try {
    const p: number = Number(await c.currentPhase());
    if (p === 0) return "Bidding";
    if (p === 1) return "Reveal";
    return "Closed";
  } catch {
    // fallback nếu contract cũ
    const now = Math.floor(Date.now() / 1000);
    try {
      const end: number = Number(await c.endTime());
      return now < end ? "Bidding" : "Closed";
    } catch {
      return "Bidding";
    }
  }
}

export async function readLeader(addr: string) {
  const c = getAuctionRead(addr);
  try {
    const [w, amt, ok] = await c.getLeader(); // (address,uint64,bool)
    if (!ok) return null;
    return { addr: String(w), amt: Number(amt) / 1e6 };
  } catch {
    return null;
  }
}

export async function fetchRevealHistory(addr: string, n = 5) {
  const c = getAuctionRead(addr);
  try {
    const rows: any[] = await c.getRecentReveals(n);
    // mỗi phần tử: (user, amount(uint64), ts)
    return rows.map((r: any) => ({
      user: String(r.user),
      amount: Number(r.amount) / 1e6,
      timeMs: Number(r.ts) * 1000,
    }));
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/* --------------------  CACHE + STABLE FETCH  ---------------------- */
/* ------------------------------------------------------------------ */

const AUCTIONS_CACHE_KEY = "fhe.cached.auctions.v1";

type CachedAuction = {
  address: string;
  item: string;
  endTimeMs: number;
  title?: string;
  imageUrl?: string;
  description?: string;
};

export function readAuctionsCache(): OnchainAuction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(AUCTIONS_CACHE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as CachedAuction[];
    return arr;
  } catch {
    return [];
  }
}

function writeAuctionsCache(list: OnchainAuction[]) {
  if (typeof window === "undefined") return;
  const slim: CachedAuction[] = list.map((x) => ({
    address: x.address,
    item: x.item,
    endTimeMs: x.endTimeMs,
    title: x.title,
    imageUrl: x.imageUrl,
    description: x.description,
  }));
  localStorage.setItem(AUCTIONS_CACHE_KEY, JSON.stringify(slim));
}

async function getReadProviderPreferWallet() {
  try {
    const eth = (window as any)?.ethereum;
    if (eth) {
      const bp = new BrowserProvider(eth);
      const net = await bp.getNetwork();
      if (Number(net.chainId) === CHAIN_ID) return bp;
    }
  } catch {}
  return new JsonRpcProvider(RPC_URL);
}

// (CHỈ MỘT HÀM) lấy danh sách auctions từ chain có retry + cache
export async function fetchAuctionsFromChain(
  opts?: { retries?: number; delayMs?: number }
): Promise<OnchainAuction[]> {
  const retries = opts?.retries ?? 5;
  const delayMs = opts?.delayMs ?? 1200;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const provider = await getReadProviderPreferWallet();
      const factoryRead = new Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
      const addrs: string[] = await factoryRead.getAllAuctions();

      const settled = await Promise.allSettled(
        addrs.map(async (addr) => {
          const c = new Contract(addr, AUCTION_ABI, provider);
          const [item, end] = await Promise.all([c.item(), c.endTime()]);
          const meta = getAuctionMeta(addr) || {};
          const img = meta.imageUrl || (getAuctionImage ? getAuctionImage(addr) : undefined);
          return {
            address: addr,
            item: String(item),
            endTimeMs: Number(end) * 1000,
            title: meta.title || String(item),
            imageUrl: img,
            description: meta.description,
          } as OnchainAuction;
        })
      );

      const ok = settled
        .filter((s): s is PromiseFulfilledResult<OnchainAuction> => s.status === "fulfilled")
        .map((s) => s.value)
        .sort((a, b) => a.endTimeMs - b.endTimeMs);

      if (ok.length > 0 || addrs.length === 0) {
        writeAuctionsCache(ok);
        return ok;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, delayMs));
  }

  return readAuctionsCache();
}
