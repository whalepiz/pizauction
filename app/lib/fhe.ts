"use client";

import {
  BrowserProvider,
  Contract,
  Interface,
  JsonRpcProvider,
} from "ethers";

// ABIs
import factoryArtifact from "@/abis/AuctionFactory.json";
import auctionArtifact from "@/abis/FHEAuction.json";
import metadataArtifact from "@/abis/MetadataRegistry.json";

// ===== ENV =====
export const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS!;
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 11155111);
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
export const METADATA_ADDRESS = process.env.NEXT_PUBLIC_METADATA_ADDRESS!;

// ===== ABIs =====
const FACTORY_ABI: any = (factoryArtifact as any).abi ?? factoryArtifact;
const AUCTION_ABI: any = (auctionArtifact as any).abi ?? auctionArtifact;
const METADATA_ABI: any = (metadataArtifact as any).abi ?? metadataArtifact;

// ===== Wallet helpers =====
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

// ===== Read provider =====
function readProvider() {
  return new JsonRpcProvider(RPC_URL);
}

// ===== Contracts =====
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
export async function getMetadataWithSigner() {
  const provider = await ensureWallet();
  const signer = await provider.getSigner();
  return new Contract(METADATA_ADDRESS, METADATA_ABI, signer);
}
export function getMetadataRead() {
  return new Contract(METADATA_ADDRESS, METADATA_ABI, readProvider());
}

// ===== Encode “encrypted” bid (placeholder) =====
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

// ===== Types =====
export type OnchainAuction = {
  address: string;
  item: string;
  endTimeMs: number;
  title?: string;
  imageUrl?: string;
  description?: string;
};

// Winner info (để Finalize/Winner UI dùng)
export type WinnerInfo = {
  winner: string | null;    // 0x... or null
  amount: string | null;    // placeholder "(encrypted)" or value nếu có
};

// ===== Create auction via Factory + ghi metadata on-chain =====
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

  // 🔒 LƯU METADATA ON-CHAIN để mọi máy nhìn như nhau
  try {
    const registry = await getMetadataWithSigner();
    const tx2 = await registry.setMeta(
      created.address,
      title,
      imageUrl,
      description || ""
    );
    await tx2.wait();
  } catch (e) {
    // không chặn flow nếu set meta fail
    console.warn("setMeta failed:", e);
  }

  return created;
}

/* ------------------------------------------------------------------ */
/* ----------------  BID / FINALIZE / GET WINNER  ------------------- */
/* ------------------------------------------------------------------ */

// đặt bid (per-auction)
export async function bidOnAuction(addr: string, amountEth: string) {
  const c = await getAuctionWithSigner(addr);
  const enc = encodeBid(amountEth);
  const tx = await c.placeBid(enc);
  return tx.wait();
}

// finalize (kết thúc, xác nhận winner — theo contract hiện tại)
export async function finalizeAuction(addr: string) {
  const c = await getAuctionWithSigner(addr);
  const tx = await c.finalize();
  return tx.wait();
}

// đọc winner (tương thích 2 biến thể: winner() hoặc leader())
export async function getWinner(addr: string): Promise<WinnerInfo> {
  const c = getAuctionRead(addr);
  // 1) thử winner()
  try {
    const w = await (c as any).winner();
    if (w && w !== "0x0000000000000000000000000000000000000000") {
      // nếu contract có amountWinner() thì đọc, không thì để placeholder
      let amount: string | null = "(encrypted)";
      try {
        const a = await (c as any).amountWinner?.();
        if (a) amount = String(a);
      } catch {}
      return { winner: String(w), amount };
    }
  } catch {}

  // 2) fallback: thử leader() trả address
  try {
    const leader = await (c as any).leader?.();
    if (leader && leader !== "0x0000000000000000000000000000000000000000") {
      return { winner: String(leader), amount: "(encrypted)" };
    }
  } catch {}

  return { winner: null, amount: null };
}

/* ------------------------------------------------------------------ */
/* -----------------  CACHE + ỔN ĐỊNH RPC FETCH  -------------------- */
/* ------------------------------------------------------------------ */

// cache đơn giản (để render ngay và giảm F5)
const AUCTIONS_CACHE_KEY = "fhe.cached.auctions.v2";
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
    return JSON.parse(raw) as CachedAuction[];
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

// ưu tiên ví (nếu đúng chain), fallback RPC_URL
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

// Fetch auctions + merge metadata từ MetadataRegistry (ON-CHAIN)
export async function fetchAuctionsFromChain(
  opts?: { retries?: number; delayMs?: number }
): Promise<OnchainAuction[]> {
  const retries = opts?.retries ?? 5;
  const delayMs = opts?.delayMs ?? 1000;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const provider = await getReadProviderPreferWallet();
      const factoryRead = new Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
      const registryRead = new Contract(METADATA_ADDRESS, METADATA_ABI, provider);

      const addrs: string[] = await factoryRead.getAllAuctions();

      const settled = await Promise.allSettled(
        addrs.map(async (addr) => {
          const c = new Contract(addr, AUCTION_ABI, provider);
          const [item, end, meta] = await Promise.all([
            c.item(),
            c.endTime(),
            registryRead.getMeta(addr),
          ]);

          // meta: {title, imageUrl, description}
          const title = meta?.title?.length ? String(meta.title) : String(item);
          const imageUrl = meta?.imageUrl?.length ? String(meta.imageUrl) : undefined;
          const description = meta?.description?.length ? String(meta.description) : undefined;

          return {
            address: addr,
            item: String(item),
            endTimeMs: Number(end) * 1000,
            title,
            imageUrl,
            description,
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
    } catch {
      // ignore & retry
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }

  // hết retry → trả cache (không trắng trang)
  return readAuctionsCache();
}

/* ------------------------------------------------------------------ */
/*  Giữ để HistoryTable compile an toàn – bạn có thể nâng cấp sau     */
/* ------------------------------------------------------------------ */
export async function fetchBidHistory(): Promise<
  { user: string; amount: string; timeMs: number }[]
> {
  return [];
}
