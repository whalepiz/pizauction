"use client";

import { v4 as uuid } from "uuid";

export type Auction = {
  id: string;
  title: string;
  imageUrl: string;
  description?: string;
  endTimeMs: number;            // khi nào đóng (UI)
  contractAddress: string;      // vẫn dùng contract hiện tại
  createdBy?: string;
  createdAt: number;
};

const KEY = "fhe.auctions.v1";

function readAll(): Auction[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as Auction[]) : [];
}

function writeAll(list: Auction[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function seedIfEmpty(defaultContract: string) {
  if (typeof window === "undefined") return;
  const exist = readAll();
  if (exist.length) return;

  const now = Date.now();
  const hours = (h: number) => now + h * 3600 * 1000;

  const samples: Auction[] = [
    {
      id: uuid(),
      title: "Neon Samurai #01",
      imageUrl: "https://picsum.photos/seed/fhe-auction-1/800/800",
      endTimeMs: hours(6),
      contractAddress: defaultContract,
      createdAt: now,
    },
    {
      id: uuid(),
      title: "Cyber Cat #77",
      imageUrl: "https://picsum.photos/seed/fhe-auction-2/800/800",
      endTimeMs: hours(7),
      contractAddress: defaultContract,
      createdAt: now,
    },
    {
      id: uuid(),
      title: "Matrix Glitch #5",
      imageUrl: "https://picsum.photos/seed/fhe-auction-3/800/800",
      endTimeMs: hours(8),
      contractAddress: defaultContract,
      createdAt: now,
    },
    {
      id: uuid(),
      title: "Synth Wave #12",
      imageUrl: "https://picsum.photos/seed/fhe-auction-4/800/800",
      endTimeMs: hours(9),
      contractAddress: defaultContract,
      createdAt: now,
    },
    {
      id: uuid(),
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

export function getAuction(id: string): Auction | undefined {
  return readAll().find((x) => x.id === id);
}

export function createAuction(input: Omit<Auction, "id" | "createdAt">) {
  const list = readAll();
  const item: Auction = { ...input, id: uuid(), createdAt: Date.now() };
  list.push(item);
  writeAll(list);
  return item;
}

