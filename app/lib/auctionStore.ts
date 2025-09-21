"use client";

/**
 * Auction metadata chỉ phục vụ UI (tiêu đề, ảnh, thời gian). Bid vẫn gọi contract thật.
 * Nếu muốn on-chain hoàn toàn: tạo AuctionFactory + event AuctionCreated rồi thay thế tầng này.
 */

export type Auction = {
  id: string;
  title: string;
  imageUrl: string;
  description?: string;
  endTimeMs: number;       // khi nào kết thúc (ms)
  contractAddress: string; // contract đấu giá hiện tại (dùng chung)
  createdBy?: string;
  createdAt: number;
};

const KEY = "fhe.auctions.v1";

/** Tạo ID ổn định, không cần cài uuid */
function genId(): string {
  if (typeof window !== "undefined" && "crypto" in window) {
    // @ts-ignore — randomUUID tồn tại trên hầu hết trình duyệt hiện đại
    if (typeof window.crypto.randomUUID === "function") {
      // @ts-ignore
      return window.crypto.randomUUID();
    }
  }
  return (
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = Math.floor(Math.random() * 16);
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    }) + "-" + Date.now().toString(16)
  );
}

function readAll(): Auction[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as Auction[]) : [];
}

function writeAll(list: Auction[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
}

/** Dùng để seed 1 lần khi trống (tuỳ chọn) */
export function seedIfEmpty(defaultContract: string) {
  if (typeof window === "undefined") return;
  const exist = readAll();
  if (exist.length) return;

  const now = Date.now();
  const hours = (h: number) => now + h * 3600 * 1000;

  const samples: Auction[] = [
    {
      id: genId(),
      title: "Neon Samurai #01",
      imageUrl: "https://picsum.photos/seed/fhe-auction-1/800/800",
      endTimeMs: hours(6),
      contractAddress: defaultContract,
      createdAt: now,
    },
    {
      id: genId(),
      title: "Cyber Cat #77",
      imageUrl: "https://picsum.photos/seed/fhe-auction-2/800/800",
      endTimeMs: hours(7),
      contractAddress: defaultContract,
      createdAt: now,
    },
    {
      id: genId(),
      title: "Matrix Glitch #5",
      imageUrl: "https://picsum.photos/seed/fhe-auction-3/800/800",
      endTimeMs: hours(8),
      contractAddress: defaultContract,
      createdAt: now,
    },
    {
      id: genId(),
      title: "Synth Wave #12",
      imageUrl: "https://picsum.photos/seed/fhe-auction-4/800/800",
      endTimeMs: hours(9),
      contractAddress: defaultContract,
      createdAt: now,
    },
    {
      id: genId(),
      title: "Pixel Hero #9",
      imageUrl: "https://picsum.photos/seed/fhe-auction-5/800/800",
      endTimeMs: hours(10),
      contractAddress: defaultContract,
      createdAt: now,
    },
  ];

  writeAll(samples);
}

export function getAuctions(): Auction[] {
  return readAll().sort((a, b) => a.endTimeMs - b.endTimeMs);
}

export function createAuction(input: Omit<Auction, "id" | "createdAt">) {
  const list = readAll();
  const item: Auction = { ...input, id: genId(), createdAt: Date.now() };
  list.push(item);
  writeAll(list);
  return item;
}

/** Cho phép lắng nghe thay đổi (đồng bộ giữa tab) */
export function onAuctionsChanged(cb: () => void) {
  const handler = (e: StorageEvent) => {
    if (e.key === KEY) cb();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}
