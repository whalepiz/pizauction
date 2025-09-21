"use client";

import { useEffect, useState } from "react";
import WalletButton from "@/components/WalletButton";
import CreateAuctionForm from "@/components/CreateAuctionForm";
import AuctionCard from "@/components/AuctionCard";
import { fetchAuctionsFromChain, OnchainAuction } from "@/lib/fhe";

export default function HomePage() {
  const [auctions, setAuctions] = useState<OnchainAuction[]>([]);

  async function load() {
    try {
      const list = await fetchAuctionsFromChain();
      setAuctions(list.sort((a, b) => a.endTimeMs - b.endTimeMs));
    } catch {
      // im lặng nếu RPC bị rate-limit
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000); // refresh mỗi 30s
    return () => clearInterval(id);
  }, []);

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
        <CreateAuctionForm onCreated={load} />

        {/* Marketplace */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Marketplace</h2>
          {auctions.length === 0 ? (
            <p className="text-sm text-white/60">
              No auctions yet. Create one above to get started.
            </p>
          ) : (
            // Grid to hơn, thoáng hơn:
            // - mobile: 1 cột
            // - sm: 2 cột
            // - lg: 3 cột
            // - xl & 2xl: 4 cột (card to)
            <div className="grid gap-7 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4">
              {auctions.map((a) => (
                <AuctionCard key={a.address} auction={a} onBid={load} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
