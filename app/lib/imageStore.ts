"use client";

type Meta = {
  title?: string;
  imageUrl?: string;
  description?: string;
};

const KEY = "fhe.meta.v1";

function safeRead(): Record<string, Meta> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, Meta>) : {};
  } catch {
    return {};
  }
}

function safeWrite(obj: Record<string, Meta>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(obj));
  } catch {}
}

export function saveAuctionMeta(address: string, meta: Meta) {
  const db = safeRead();
  db[address.toLowerCase()] = { ...(db[address.toLowerCase()] || {}), ...meta };
  safeWrite(db);
}

export function getAuctionMeta(address: string): Meta | undefined {
  const db = safeRead();
  return db[address.toLowerCase()];
}

export function getAuctionImage(address: string): string | undefined {
  return getAuctionMeta(address)?.imageUrl;
}
