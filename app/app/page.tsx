"use client";

import { useEffect, useMemo, useState } from "react";
import WalletButton from "@/components/WalletButton";
import CreateAuctionForm from "@/components/CreateAuctionForm";
import AuctionCard from "@/components/AuctionCard";
import { fetchAuctionsFromChain, OnchainAuction } from "@/lib/fhe";

const PAGE_SIZE = 12; // 4 cột x 3 hàng

export default function HomePage() {
  const [auctions, setAuctions] = useState<OnchainAuction[]>([]);
  const [page, setPage] = useState(0);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(auctions.length / PAGE_SIZE)),
    [auctions.length]
  );
  const visible = useMemo(() => {
    const start = page * PAGE_SIZE;
    return auctions.slice(start, start + PAGE_SIZE);
  }, [auctions, page]);

  async function load() {
    try {
      const list = await fetchAuctionsFromChain();
      setAuctions(list.sort((a, b) => a.endTimeMs - b.endTimeMs));
    } catch {
      /* silent (rate-limit) */
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  // ===== optimistic + sync khi vừa tạo xong =====
  async function onCreatedOptimistic(created: {
    address: string;
    endTime: number; // seconds
    item: string;
    title: string;
    imageUrl: string;
    description?: string;
  }) {
    // 1) Đẩy vào UI ngay
    const optimistic: OnchainAuction = {
      address: created.address,
      item: created.item,
      endTimeMs: created.endTime * 1000,
      title: created.title || created.item,
      imageUrl: created.imageUrl,
      description: created.description,
    };
    setAuctions((prev) => {
      // tránh trùng nếu lỡ có
      const exist = prev.find((x) => x.address.toLowerCase() === created.address.toLowerCase());
      const merged = exist ? prev : [optimistic, ...prev];
      return merged.sort((a, b) => a.endTimeMs - b.endTimeMs);
    });
    setPage(0); // luôn bật về trang đầu để thấy auction mới

    // 2) Đồng bộ lại với on-chain (thử 5 lần, mỗi lần cách 1.2s)
    for (let i = 0; i < 5; i++) {
      await new Promise((r) => setTimeout(r, 1200));
      try {
        const list = await fetchAuctionsFromChain();
        const found = list.find(
          (x) => x.address.toLowerCase() === created.address.toLowerCase()
        );
        if (found) {
          setAuctions(list.sort((a, b) => a.endTimeMs - b.endTimeMs));
          break;
        }
      } catch {
        // bỏ qua, thử lần sau
      }
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(60%_60%_at_50%_0%,rgba(120,119,198,0.15)_0,transparent_60%),linear-gradient(to_bottom,rgba(10,10,10,1),rgba(0,0,0,1))] text-white">
      {/* Header */}
      <div className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <span className="text-yellow-400">⚡</span> FHE Private Auction
        </h1>
        <WalletButton />
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-24 space-y-10">
        {/* Create */}
        <CreateAuctionForm onCreated={onCreatedOptimistic} />

        {/* Marketplace */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Marketplace</h2>

            {/* Controls phân trang */}
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1 rounded-md border border-white/15 bg-white/5 hover:bg-white/10 disabled:opacity-40"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                ← Prev
              </button>
              <span className="text-sm text-white/70">
                Page {page + 1} / {totalPages}
              </span>
              <button
                className="px-3 py-1 rounded-md border border-white/15 bg-white/5 hover:bg-white/10 disabled:opacity-40"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Next →
              </button>
            </div>
          </div>

          {auctions.length === 0 ? (
            <p className="text-sm text-white/60">
              No auctions yet. Create one above to get started.
            </p>
          ) : (
            // 4 cột x 3 hàng (12 item)
            <div className="grid gap-7 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visible.map((a) => (
                <AuctionCard key={a.address} auction={a} onBid={load} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
