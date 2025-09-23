"use client";

import { useEffect, useMemo, useState } from "react";
import WalletButton from "@/components/WalletButton";
import CreateAuctionForm from "@/components/CreateAuctionForm";
import AuctionCard from "@/components/AuctionCard";
import {
  fetchAuctionsFromChain,
  readAuctionsCache,
  type OnchainAuction,
} from "@/lib/fhe";

export default function HomePage() {
  const [auctions, setAuctions] = useState<OnchainAuction[]>([]);
  const [loading, setLoading] = useState(false);

  // pagination: 4 cols x 3 rows
  const pageSize = 12;
  const [page, setPage] = useState(1);

  // 👉 Sắp xếp: open (ending soon → later) rồi mới closed (newly closed → older)
  const ordered = useMemo<OnchainAuction[]>(() => {
    const now = Date.now();
    const open: OnchainAuction[] = [];
    const closed: OnchainAuction[] = [];
    for (const a of auctions) {
      (a.endTimeMs > now ? open : closed).push(a);
    }
    open.sort((a, b) => a.endTimeMs - b.endTimeMs);   // gần hết hạn lên đầu
    closed.sort((a, b) => b.endTimeMs - a.endTimeMs); // mới kết thúc đứng trước
    return [...open, ...closed];
  }, [auctions]);

  const totalPages = Math.max(1, Math.ceil(ordered.length / pageSize));
  const visible = useMemo(() => {
    const start = (page - 1) * pageSize;
    return ordered.slice(start, start + pageSize);
  }, [ordered, page]);

  async function load(force = false) {
    // 1) Hiển thị tức thì bằng cache (nếu có)
    if (!force) {
      const cached = readAuctionsCache();
      if (cached.length) setAuctions(cached);
    }

    // 2) Gọi mạng (ổn định + retry) để cập nhật
    try {
      setLoading(true);
      const fresh = await fetchAuctionsFromChain({ retries: 5, delayMs: 1200 });
      setAuctions(fresh);
      // Nếu đang ở trang > tổng, kéo về cuối cùng để tránh trắng
      const nextTotal = Math.max(1, Math.ceil(fresh.length / pageSize));
      setPage((p) => Math.min(p, nextTotal));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // auto refresh mỗi 20s
    const id = setInterval(() => load(), 20000);
    return () => clearInterval(id);
  }, []);

  return (
    <main className="min-h-screen bg-[radial-gradient(60%_60%_at_50%_0%,rgba(120,119,198,0.15)_0,transparent_60%),linear-gradient(to_bottom,rgba(10,10,10,1),rgba(0,0,0,1))] text-white">
      {/* Header */}
      <div className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <span className="text-yellow-400">⚡</span>
            <span>Private NFT Auctions</span>
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
            <span className="rounded-full border border-white/15 px-2 py-0.5 bg-white/5">
              Encrypted bids (FHE)
            </span>
            <span className="rounded-full border border-white/15 px-2 py-0.5 bg-white/5">
              On-chain metadata
            </span>
          </div>
        </div>
        <WalletButton />
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-24 space-y-10">
        {/* Create */}
        <CreateAuctionForm onCreated={() => load(true)} />

        {/* Marketplace */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Marketplace</h2>
            <div className="flex items-center gap-2 text-sm text-white/70">
              <button
                className="px-3 py-1 rounded border border-white/15 hover:bg-white/5 disabled:opacity-40"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                ← Prev
              </button>
              <span>
                Page {page} / {totalPages}
              </span>
              <button
                className="px-3 py-1 rounded border border-white/15 hover:bg-white/5 disabled:opacity-40"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next →
              </button>
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="text-sm text-white/60">
              {loading
                ? "Loading auctions…"
                : "No auctions yet. Create one above to get started."}
            </p>
          ) : (
            <div className="grid gap-7 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visible.map((a) => (
                <AuctionCard key={a.address} auction={a} onBid={() => load()} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
