"use client";

const KEY = "fhe.images.v1"; // { [address]: url }

function read(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function write(map: Record<string, string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {}
}

export function saveAuctionImage(address: string, url: string) {
  if (!address || !url) return;
  const map = read();
  map[address.toLowerCase()] = url;
  write(map);
}

export function getAuctionImage(address: string): string | undefined {
  if (!address) return;
  const map = read();
  return map[address.toLowerCase()];
}
