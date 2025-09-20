import { BrowserProvider, Contract } from "ethers";
import auctionAbi from "@/abis/FHEAuction.json";

/** TẠM THỜI: chuyển số thành bytes hex (demo) */
function toHex(u8: Uint8Array): string {
  let out = "0x";
  for (let i = 0; i < u8.length; i++) out += u8[i].toString(16).padStart(2,"0");
  return out;
}
export async function encryptBidBytes(amountEth: string): Promise<string> {
  const scaled = Math.floor(Number(amountEth) * 1e6);
  const u8 = new Uint8Array(4);
  u8[0] = (scaled >>> 24) & 0xff;
  u8[1] = (scaled >>> 16) & 0xff;
  u8[2] = (scaled >>> 8) & 0xff;
  u8[3] = scaled & 0xff;
  return toHex(u8);
}

export async function getAuctionContract() {
  if (!(window as any).ethereum) throw new Error("No wallet found");
  const provider = new BrowserProvider((window as any).ethereum);
  const signer = await provider.getSigner();
  const address = process.env.NEXT_PUBLIC_AUCTION_ADDRESS!;
  return new Contract(address, auctionAbi as any, signer);
}

export async function connectWallet() {
  await (window as any).ethereum?.request({ method: "eth_requestAccounts" });
}
