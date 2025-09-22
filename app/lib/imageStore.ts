"use client";

import { BrowserProvider, Contract, JsonRpcProvider } from "ethers";
import registryArtifact from "@/abis/MetadataRegistry.json";

/** ENV */
const REGISTRY_ADDR = process.env.NEXT_PUBLIC_METADATA_ADDRESS || ""; // <- bắt buộc để đồng bộ đa máy
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;

/** ABI */
const REGISTRY_ABI: any = (registryArtifact as any).abi ?? registryArtifact;

/** Types */
export type AuctionMeta = {
  title?: string;
  imageUrl?: string;
  description?: string;
};

const LS_KEY = "fhe.metadata.cache.v1";

/** Local cache helpers */
function readAll(): Record<string, AuctionMeta> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, AuctionMeta>) : {};
  } catch {
    return {};
  }
}
function writeAll(map: Record<string, AuctionMeta>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(map));
}
function norm(addr: string) {
  return (addr || "").toLowerCase();
}

/** Fallback ảnh DETERMINISTIC theo địa chỉ contract (mọi máy như nhau) */
export function getAuctionImage(addr: string): string {
  const seed = norm(addr).replace(/^0x/, "");
  // dùng picsum seed cố định theo địa chỉ: mọi máy cùng 1 URL
  return `https://picsum.photos/seed/fhe-${seed}/800/800`;
}

/** Local get/set (cho UI hiển thị tức thì) */
export function getAuctionMeta(addr: string): AuctionMeta | undefined {
  const all = readAll();
  return all[norm(addr)];
}
function setAuctionMetaLocal(addr: string, meta: AuctionMeta) {
  const all = readAll();
  all[norm(addr)] = { ...(all[norm(addr)] || {}), ...meta };
  writeAll(all);
}

/** Provider đọc */
function readProvider() {
  return new JsonRpcProvider(RPC_URL);
}

/** Ghi meta on-chain (nếu có REGISTRY_ADDR) + cache local
 *  FE đã gọi hàm này sau khi create xong (trong createAuctionOnChain).
 */
export async function saveAuctionMeta(
  addr: string,
  meta: AuctionMeta
): Promise<void> {
  // luôn set local để UI hiện ngay
  setAuctionMetaLocal(addr, meta);

  // nếu chưa cấu hình registry → dừng ở local (vẫn ổn định nhờ fallback deterministic)
  if (!REGISTRY_ADDR) return;

  // viết on-chain
  if (!(window as any)?.ethereum) return;
  const provider = new BrowserProvider((window as any).ethereum);
  const signer = await provider.getSigner();
  const reg = new Contract(REGISTRY_ADDR, REGISTRY_ABI, signer);

  const title = meta.title ?? "";
  const imageUrl = meta.imageUrl ?? "";
  const description = meta.description ?? "";

  const tx = await reg.setMetadata(addr, title, imageUrl, description);
  await tx.wait();
}

/** Đọc meta on-chain (nếu có), đồng thời cache local.
 *  Dùng trong fetchAuctionsFromChain để đồng bộ đa máy.
 */
export async function readMetaOnchain(addr: string): Promise<AuctionMeta | null> {
  if (!REGISTRY_ADDR) return null;
  try {
    const reg = new Contract(REGISTRY_ADDR, REGISTRY_ABI, readProvider());
    const [title, imageUrl, description] = await reg.getMetadata(addr);
    const meta: AuctionMeta = {
      title: title || undefined,
      imageUrl: imageUrl || undefined,
      description: description || undefined,
    };
    // cache local để lần sau load nhanh
    setAuctionMetaLocal(addr, meta);
    return meta;
  } catch {
    return null;
  }
}
