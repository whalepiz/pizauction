"use client";

import { BrowserProvider, Contract, JsonRpcProvider } from "ethers";

/**
 * MetadataRegistry (đơn giản):
 * interface IMetadataRegistry {
 *   function setMetadata(address auction, string title, string imageUrl, string description) external;
 *   function getMetadata(address auction) external view returns (string title, string imageUrl, string description);
 * }
 */

const METADATA_ADDRESS = process.env.NEXT_PUBLIC_METADATA_ADDRESS || "";
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 11155111);

// ABI tối giản cho MetadataRegistry
const METADATA_ABI = [
  "function setMetadata(address auction, string title, string imageUrl, string description) external",
  "function getMetadata(address auction) external view returns (string title, string imageUrl, string description)",
];

// ---------------- Local cache (nhanh) ----------------
export type AuctionMeta = {
  title?: string;
  imageUrl?: string;
  description?: string;
};

const LS_KEY = "fhe.meta.v1";

function readAllLocal(): Record<string, AuctionMeta> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, AuctionMeta>) : {};
  } catch {
    return {};
  }
}

function writeAllLocal(map: Record<string, AuctionMeta>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(map));
}

export function getAuctionMeta(addr: string): AuctionMeta | undefined {
  const store = readAllLocal();
  return store[addr.toLowerCase()];
}

/** Fallback ảnh deterministic theo địa chỉ để mọi máy giống nhau */
export function getAuctionImage(addr: string): string {
  const seed = addr?.toLowerCase() || "placeholder";
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/800/800`;
}

/**
 * Lưu metadata local ngay lập tức (cho creator thấy tức thời),
 * đồng thời thử ghi on-chain nếu có MetadataRegistry.
 */
export async function saveAuctionMeta(
  addr: string,
  meta: AuctionMeta
): Promise<void> {
  // 1) cập nhật local
  const key = addr.toLowerCase();
  const store = readAllLocal();
  store[key] = {
    title: meta.title || store[key]?.title,
    imageUrl: meta.imageUrl || store[key]?.imageUrl,
    description: meta.description || store[key]?.description,
  };
  writeAllLocal(store);

  // 2) ghi on-chain nếu có config MetadataRegistry
  if (!METADATA_ADDRESS) return; // không có registry -> bỏ qua phần on-chain

  try {
    const eth = (window as any)?.ethereum;
    if (!eth) return; // không có ví -> bỏ qua ghi on-chain (local vẫn còn)
    const provider = new BrowserProvider(eth);
    const net = await provider.getNetwork();
    if (Number(net.chainId) !== CHAIN_ID) {
      // sai chain thì thôi, vẫn giữ local; tránh chặn UI
      return;
    }
    const signer = await provider.getSigner();
    const reg = new Contract(METADATA_ADDRESS, METADATA_ABI, signer);
    const tx = await reg.setMetadata(
      addr,
      meta.title || "",
      meta.imageUrl || "",
      meta.description || ""
    );
    await tx.wait();
  } catch {
    // im lặng: local vẫn hoạt động; lần sau các máy khác sẽ fallback deterministic
  }
}

/** Đọc metadata on-chain (ưu tiên hiển thị đồng bộ đa máy) */
export async function readMetaOnchain(
  addr: string
): Promise<AuctionMeta | null> {
  if (!METADATA_ADDRESS) return null;
  try {
    // ưu tiên ví nếu đang đúng chain (để giảm rate-limit); nếu không dùng RPC public
    const eth = (typeof window !== "undefined" ? (window as any).ethereum : null);
    let provider: any;
    if (eth) {
      try {
        const bp = new BrowserProvider(eth);
        const net = await bp.getNetwork();
        provider = Number(net.chainId) === CHAIN_ID ? bp : new JsonRpcProvider(RPC_URL);
      } catch {
        provider = new JsonRpcProvider(RPC_URL);
      }
    } else {
      provider = new JsonRpcProvider(RPC_URL);
    }

    const reg = new Contract(METADATA_ADDRESS, METADATA_ABI, provider);
    const res = await reg.getMetadata(addr);
    // ethers v6 tuple: { 0: title, 1: image, 2: desc, title, imageUrl, description }
    const title = String((res as any).title ?? res[0] ?? "");
    const imageUrl = String((res as any).imageUrl ?? res[1] ?? "");
    const description = String((res as any).description ?? res[2] ?? "");

    // đồng bộ lại local cache để lần sau load nhanh
    const key = addr.toLowerCase();
    const store = readAllLocal();
    store[key] = {
      title: title || store[key]?.title,
      imageUrl: imageUrl || store[key]?.imageUrl,
      description: description || store[key]?.description,
    };
    writeAllLocal(store);

    if (!title && !imageUrl && !description) return null;
    return { title, imageUrl, description };
  } catch {
    return null;
  }
}
