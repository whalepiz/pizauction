"use client";

import {
  BrowserProvider,
  Contract,
  Interface,
  JsonRpcProvider,
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
// alias cho nút Connect
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

  // lưu metadata cục bộ (đồng bộ ảnh giữa mọi máy nhờ cùng địa chỉ + cùng URL bạn nhập)
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

/** ==== (giữ cho HistoryTable compile an toàn) ==== */
export async function fetchBidHistory(): Promise<
  { user: string; amount: string; timeMs: number }[]
> {
  return []; // v1 hiển thị lịch sử theo-card; có thể nâng cấp sau
}

/** ==== Bid per-auction ==== */
export async function bidOnAuction(addr: string, amountEth: string) {
  const c = await getAuctionWithSigner(addr);
  const enc = encodeBid(amountEth);
  const tx = await c.placeBid(enc);
  return tx.wait();
}

/** ==== Finalize & Winner (NEW) ==== */
export async function finalizeAuction(addr: string) {
  const c = await getAuctionWithSigner(addr);
  const tx = await c.finalize(); // gọi đúng hàm finalize() trong contract mới
  return tx.wait();
}
export async function readEnded(addr: string): Promise<boolean> {
  const c = getAuctionRead(addr);
  return Boolean(await c.ended());
}
export async function readWinner(addr: string): Promise<string> {
  const c = getAuctionRead(addr);
  return String(await c.winner());
}

/* ------------------------------------------------------------------ */
/* --------------------  CACHE + STABLE FETCH  ---------------------- */
/* ------------------------------------------------------------------ */

// ==== CACHE KEYS ====
const AUCTIONS_CACHE_KEY = "fhe.cached.auctions.v1";

type CachedAuction = {
  address: string;
  item: string;
  endTimeMs: number;
  title?: string;
  imageUrl?: string;
  description?: string;
};

// Đọc cache nhanh để render trước
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

// Ghi cache sau khi fetch thành công
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

// Provider đọc: ưu tiên ví (nếu đã mở & đúng chain), fallback RPC_URL
async function getReadProviderPreferWallet() {
  try {
    const eth = (window as any)?.ethereum;
    if (eth) {
      const bp = new BrowserProvider(eth);
      const net = await bp.getNetwork();
      if (Number(net.chainId) === CHAIN_ID) return bp;
    }
  } catch { /* ignore */ }
  return new JsonRpcProvider(RPC_URL);
}

// ==== Load auctions from chain (ổn định + retry + cache) ====
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

      // Đọc song song, chống lỗi mạng bằng allSettled
      const settled = await Promise.allSettled(
        addrs.map(async (addr) => {
          const c = new Contract(addr, AUCTION_ABI, provider);
          const [item, end] = await Promise.all([c.item(), c.endTime()]);
          // Ưu tiên metadata đã lưu; fallback ảnh từ getAuctionImage(addr)
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
      // Nếu empty (RPC vừa chưa index) → retry
    } catch {
      // ignore & retry
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }

  // Hết retry → trả cache (nếu có), không trắng trang
  const cached = readAuctionsCache();
  return cached;
}
