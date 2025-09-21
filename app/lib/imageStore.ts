"use client";

const KEY = "fhe.images.v1";

type Dict = Record<string, string>; // { auctionAddr: imageUrl }

function read(): Dict {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as Dict) : {};
}

function write(d: Dict) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(d));
}

export function saveAuctionImage(addr: string, url: string) {
  const d = read();
  d[addr.toLowerCase()] = url;
  write(d);
}

export function getAuctionImage(addr: string): string | undefined {
  const d = read();
  return d[addr.toLowerCase()];
}
