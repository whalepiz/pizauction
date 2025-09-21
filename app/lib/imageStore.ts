"use client";

type Meta = { title?: string; imageUrl?: string; description?: string };

const KEY = "fhe.market.meta.v1";

function readAll(): Record<string, Meta> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(obj: Record<string, Meta>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(obj));
}

export function saveAuctionMeta(
  address: string,
  meta: Meta
) {
  const all = readAll();
  all[address.toLowerCase()] = { ...(all[address.toLowerCase()] || {}), ...meta };
  writeAll(all);
}

export function getAuctionMeta(address: string): Meta | undefined {
  const all = readAll();
  return all[address.toLowerCase()];
}
