"use client";

import {
  BrowserProvider,
  Contract,
  Interface,
  JsonRpcProvider,
  Log,
} from "ethers";

import factoryArtifact from "@/abis/AuctionFactory.json";
import auctionArtifact from "@/abis/FHEAuction.json";
import metadataArtifact from "@/abis/MetadataRegistry.json";

/** ==== ENV ==== */
export const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS!;
export const METADATA_ADDRESS = process.env.NEXT_PUBLIC_METADATA_ADDRESS!;
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 11155111);
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;

/** ==== ABIs ==== */
const FACTORY_ABI: any = (factoryArtifact as any).abi ?? factoryArtifact;
const AUCTION_ABI: any = (auctionArtifact as any).abi ?? auctionArtifact;
const METADATA_ABI: any = (metadataArtifact as any).abi ?? metadataArtifact;

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
function getMetadataWithSigner() {
  const provider = new BrowserProvider((window as any).ethereum);
  return provider.getSigner().then(
    (signer) => new Contract(METADATA_ADDRESS, METADATA_ABI, signer)
  );
}
function getMetadataRead() {
  return new Contract(METADATA_ADDRESS, METADATA_ABI, readProvider());
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

/** ==== Create auction via Factory + LƯU METADATA ON-CHAIN ==== */
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

  // Parse event AuctionCreated(address,string,uint256,address)
  const iface = new Interface(FACTORY_ABI);
  const evt = iface.getEvent("AuctionCreated(address,string,uint256,address)");
  const topic = evt!.topicHash;

  let created = { address: "", endTime: 0, item: title };
  (receipt?.logs || []).forEach((l: any) => {
    try {
      if (l.topics?.[0] === topic) {
        const parsed = iface.parseLog(l as Log);
        if (parsed) {
          created = {
            address: String(parsed.args[0]),
            item: String(parsed.args[1]),
            endTime: Number(parsed.args[2]),
          };
        }
      }
    } catch {}
  });

  if (!created.address) throw new Error("Create failed: no event parsed");

  // LƯU METADATA vào MetadataRegistry (để mọi máy nhìn thấy ảnh/desc giống nhau)
  const metaC = await getMetadataWithSigner();
  await (await metaC.saveMeta(created.address, title, imageUrl, description || "")).wait();

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

export type WinnerInfo = {
  winner: string;
  timestamp: number;
};

/** ==== Bid per-auction ==== */
export async function bidOnAuction(addr: string, amountEth: string) {
  const c = await getAuctionWithSigner(addr);
  const enc = encodeBid(amountEth);
  const tx = await c.placeBid(enc);
  return tx.wait();
}

/** ==== Finalize & Winner ==== */
export async function finalizeAuction(addr: string) {
  const c = await getAuctionWithSigner(addr);
  const tx = await c.finalize();
  return tx.wait();
}
export async function getWinner(addr: string): Promise<WinnerInfo | null> {
  const c = getAuctionRead(addr);
  try {
    const w: string = await c.winner();
    const t: bigint = await c.winnerTimestamp();
    if (w && w !== "0x0000000000000000000000000000000000000000") {
      return { winner: w, timestamp: Number(t) };
    }
  } catch {
    // nếu contract cũ chưa có winner(), trả null
  }
  return null;
}

/** ==== Lịch sử (v1: giữ stub để HistoryTable không lỗi) ==== */
export async function fetchBidHistory(): Promise<
  { user: string; amount: string; timeMs: number }[]
> {
  return [];
}

/* ------------------------------------------------------------------ */
/* --------------------  FETCH AUCTIONS (from chain)  ---------------- */
/* ------------------------------------------------------------------ */
export async function fetchAuctionsFromChain(): Promise<OnchainAuction[]> {
  const provider = readProvider();
  const factory = new Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
  const metaR = getMetadataRead();

  const addrs: string[] = await factory.getAllAuctions();

  const list = await Promise.all(
    addrs.map(async (addr) => {
      const c = new Contract(addr, AUCTION_ABI, provider);
      const item: string = await c.item();
      const endTime: bigint = await c.endTime();
      let title = item;
      let imageUrl = "";
      let description = "";

      try {
        const meta = await metaR.getMeta(addr);
        title = meta.title || item;
        imageUrl = meta.imageUrl || "";
        description = meta.description || "";
      } catch {
        // nếu registry chưa có meta, dùng fallback
      }

      return {
        address: addr,
        item,
        endTimeMs: Number(endTime) * 1000,
        title,
        imageUrl,
        description,
      };
    })
  );

  return list.sort((a, b) => a.endTimeMs - b.endTimeMs);
}
