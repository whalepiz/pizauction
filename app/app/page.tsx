"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { connectWallet, fetchAuctionsFromChain, OnchainAuction } from "@/lib/fhe";
import CreateAuctionForm from "@/components/CreateAuctionForm";
import AuctionCard from "@/components/AuctionCard";

export default function HomePage() {
  const [connected, setConnected] = useState(false);
  const [auctions, setAuctions] = useState<OnchainAuction[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const list = await fetchAuctionsFromChain();
      setAuctions(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // nạp danh sách từ Factory on-chain
    refresh();

    // auto refresh mỗi 30s để cập nhật countdown/danh sách
    const t = setInterval(refresh, 30_000);
    return () => clearInterval(t);
  }, [refresh]);

  async function onConnect() {
    try {
      await connectWallet();
      setConnected(true);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-neutral-950 to-black text-white">
      {/* Header */}
      <div className="mx-auto max-w-6xl px-5 py-6 flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <span className="text-yellow-400">⚡</span> FHE Private Auction
        </h1>
        <Button
          onClick={onConnect}
          className={connected ? "bg-emerald-500 hover:bg-emerald-400" : ""}
        >
          {connected ? "Wallet Connected" : "Connect Wallet"}
        </Button>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-6xl px-5 pb-20 space-y-10">
        {/* Create auction (deploy qua Factory từ FE) */}
        <section className="rounded-xl border border-white/10 bg-[#0b1220] p-4 md:p-6">
          <CreateAuctionForm onCreated={refresh} />
        </section>

        {/* Marketplace grid */}
        <section>
          <h2 className="text-xl font-semibold mb-3">Marketplace</h2>

          {loading ? (
            <p className="text-sm text-white/60">Loading auctions…</p>
          ) : auctions.length === 0 ? (
            <p className="text-sm text-white/60">
              No auctions yet. Create one above to get started.
            </p>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {auctions.map((a) => (
                <AuctionCard key={a.address} a={a} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
