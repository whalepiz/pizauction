"use client";

import { BrowserProvider, Contract, JsonRpcProvider } from "ethers";

/**
 * Metadata sync đa máy:
 * - Ưu tiên on-chain contract (NEXT_PUBLIC_METADATA_ADDRESS)
 * - Fallback localStorage để hiển thị tức thì & cache
 * Hỗ trợ nhiều ABI phổ biến:
 *   setMeta(address,string,string,string) / getMeta(address) returns (string,string,string)
 *   metas(address) returns (string title,string imageUrl,string description)
 *   setImage(address,string) / getImage(address) returns (string)
 */

export type AuctionMeta = {
  title?: string;
  imageUrl?: string;
  description?: string;
};

const META_ADDRESS = process.env.NEXT_PUBLIC_METADATA_ADDRESS || "";
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "";
const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 11155111);

const META_ABI = [
  // full meta
  "function setMeta(address auction,string title,string imageUrl,string description)",
  "function getMeta(address auction) view returns (string title,string imageUrl,string description)",
  "function metas(address) view returns (tuple(string title,string imageUrl,string description))",

  // image-only
  "function setImage(address auction,string imageUrl)",
  "function getImage(address auction) view returns (string imageUrl)",
];

// ------------ Providers ------------
function getReadProvider() {
  return new JsonRpcProvider(RPC_URL);
}

async function ensureWallet() {
  const eth = (window as any)?.ethereum;
  if (!eth) throw new Error("No wallet found");
  await eth.request({ method: "eth_requestAccounts" });
  const bp = new BrowserProvider(eth);
  const net = await bp.getNetwork();
  if (Number(net.chainId) !== CHAIN_ID) {
    throw new Error(`Wrong network. Please switch to chainId ${CHAIN_ID}.`);
  }
  return bp;
}

function hasMetadataContract() {
  return Boolean(META_ADDRESS && META_ADDRESS.startsWith("0x"));
}

// ------------ Local cache ------------
const KEY_PREFIX = "fhe.meta.v1.";

function keyOf(addr: string) {
  return KEY_PREFIX + addr.toLowerCase();
}

function readLocal(addr: string): AuctionMeta | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(keyOf(addr));
    return raw ? (JSON.parse(raw) as AuctionMeta) : undefined;
  } catch {
    return undefined;
  }
}

function writeLocal(addr: string, meta: AuctionMeta) {
  if (typeof window === "undefined") return;
  try {
    const cur = readLocal(addr) || {};
    const merged: AuctionMeta = {
      title: meta.title ?? cur.title,
      imageUrl: meta.imageUrl ?? cur.imageUrl,
      description: meta.description ?? cur.description,
    };
    localStorage.setItem(keyOf(addr), JSON.stringify(merged));
  } catch {}
}

// ------------ On-chain helpers ------------
function contractRead() {
  return new Contract(META_ADDRESS, META_ABI, getReadProvider());
}

async function contractWrite() {
  const bp = await ensureWallet();
  const signer = await bp.getSigner();
  return new Contract(META_ADDRESS, META_ABI, signer);
}

async function tryGetOnchainMeta(addr: string): Promise<AuctionMeta | null> {
  if (!hasMetadataContract()) return null;
  const c = contractRead();

  // 1) getMeta(address) -> (title,imageUrl,description)
  try {
    const r = await (c as any).getMeta(addr);
    if (Array.isArray(r) || typeof r === "object") {
      const title = String((r as any)[0] ?? (r as any).title ?? "");
      const imageUrl = String((r as any)[1] ?? (r as any).imageUrl ?? "");
      const description = String((r as any)[2] ?? (r as any).description ?? "");
      return { title: title || undefined, imageUrl: imageUrl || undefined, description: description || undefined };
    }
  } catch {}

  // 2) metas(address) -> tuple
  try {
    const m = await (c as any).metas(addr);
    if (Array.isArray(m) || typeof m === "object") {
      const title = String((m as any)[0] ?? (m as any).title ?? "");
      const imageUrl = String((m as any)[1] ?? (m as any).imageUrl ?? "");
      const description = String((m as any)[2] ?? (m as any).description ?? "");
      return { title: title || undefined, imageUrl: imageUrl || undefined, description: description || undefined };
    }
  } catch {}

  // 3) getImage(address) -> string
  try {
    const img = await (c as any).getImage(addr);
    if (img && typeof img === "string") {
      return { imageUrl: img };
    }
  } catch {}

  return null;
}

async function trySetOnchainMeta(addr: string, meta: AuctionMeta): Promise<void> {
  if (!hasMetadataContract()) return;
  // ưu tiên setMeta đầy đủ
  try {
    const c = await contractWrite();
    if ((c.interface as any).getFunction?.("setMeta(address,string,string,string)")) {
      const tx = await (c as any).setMeta(addr, meta.title || "", meta.imageUrl || "", meta.description || "");
      await tx.wait();
      return;
    }
  } catch {}

  // fallback setImage
  try {
    const c = await contractWrite();
    if (meta.imageUrl && (c.interface as any).getFunction?.("setImage(address,string)")) {
      const tx = await (c as any).setImage(addr, meta.imageUrl);
      await tx.wait();
      return;
    }
  } catch {}
}

// ------------ Public API ------------
/** Ghi meta: luôn ghi local ngay; nếu có metadata contract thì ghi on-chain (fire-and-forget) */
export function saveAuctionMeta(addr: string, meta: AuctionMeta) {
  writeLocal(addr, meta);
  if (hasMetadataContract()) {
    // fire-and-forget để UI mượt
    void trySetOnchainMeta(addr, meta).catch(() => {});
  }
}

/** Đọc meta đồng bộ (local) — dùng cho render ngay */
export function getAuctionMeta(addr: string): AuctionMeta | undefined {
  return readLocal(addr);
}

/** Trả về URL ảnh (local cache) */
export function getAuctionImage(addr: string): string | undefined {
  return (readLocal(addr) || {}).imageUrl;
}

/** Đọc meta on-chain và ghi cache local (để đồng bộ đa máy) */
export async function readMetaOnchain(addr: string): Promise<AuctionMeta | null> {
  if (!hasMetadataContract()) return null;
  const m = await tryGetOnchainMeta(addr);
  if (m) writeLocal(addr, m);
  return m;
}
