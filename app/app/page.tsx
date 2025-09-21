"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import CreateAuctionInline from "@/components/CreateAuctionInline";
import AuctionCard from "@/components/AuctionCard";
import { fetchAuctionsFromChain } from "@/lib/fhe";

// ===== các phần "đấu giá cũ" giữ nguyên nếu bạn muốn hiển thị bên dưới:
import AuctionInfo from "@/components/AuctionInfo";
import BidForm from "@/components/BidForm";
import StatusPanel from "@/components/StatusPanel";
import FaqPanel from "@/components/FaqPanel";
import Countdown from "@/components/Countdown";
import { readAuctionState, fetchTotalBids, connectWallet } from "@/lib/fhe";

type Phase = "Bidding" | "Closed";

export default function HomePage() {
  // on-chain marketplace
  const [auctions, setAuctions] = useState<
    { address: string; item: string; endTimeMs: number; imageUrl?: string }[]
  >([]);

  // header actions
  const [connected, setConnected] = useState(false);

  // phần đấu giá cũ
  const [endTimeMs, setEndTimeMs] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("Bidding");
  const [totalBids, setTotalBids] = useState<number>(0);
  const fakeLogs = ["Auction started", "New bid submitted"];

  // load marketplace auctions
  const loadAuctions = async () => {
    try {
      const list = await fetchAuctionsFromChain();
      setAuctions(list);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadAuctions();
  }, []);

  // giữ phần cũ: đọc endTime/phase/tổng bid của contract mẫu
  useEffect(() => {
    let timer: any;
    const load = async () => {
      try {
        const s = await readAuctionState();
        setEndTimeMs(s.endTimeMs);
        setPhase(s.phase as Phase);
        const n = await fetchTotalBids().catch(() => 0);
        setTotalBids(n);
      } catch (e) {
        console.error(e);
      }
    };
    load();
    timer = setInterval(load, 30_000);
    return () => clearInterval(timer);
  }, []);

  async function onConnect() {
    try {
      await connectWallet();
      setConnected(true);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-black to-neutral-950 text-white">
      {/* top bar */}
      <div className="mx-auto max-w-6xl px-5 py-6 flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <span className="text-amber-400">⚡</span> FHE Private Auction
        </h1>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <a href="/#marketplace">Marketplace</a>
          </Button>
          <Button onClick={onConnect} className={connected ? "bg-emerald-500 hover:bg-emerald-400" : ""}>
            {connected ? "Wallet Connected" : "Connect Wallet"}
          </Button>
        </div>
      </div>

      {/* body */}
      <div className="mx-auto max-w-6xl px-5 pb-16 space-y-10">
        {/* Create auction (on-chain) */}
        <CreateAuctionInline onCreated={() => loadAuctions()} />

        {/* Marketplace */}
        <section id="marketplace" className="space-y-4">
          <div className="text-lg font-semibold">Marketplace</div>
          {auctions.length === 0 ? (
            <div className="text-sm text-neutral-400">
              No auctions yet. Create the first one above.
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {auctions.map((a) => (
                <AuctionCard
                  key={a.address}
                  address={a.address}
                  title={a.item}
                  endTimeMs={a.endTimeMs}
                  imageUrl={a.imageUrl}
                />
              ))}
            </div>
          )}
        </section>

        {/* ===== Giữ khu vực "đấu giá cũ" để bạn demo thêm ===== */}
        <section className="space-y-6">
          <AuctionInfo
            totalBids={totalBids}
            timeLeft={endTimeMs ? <Countdown endTime={endTimeMs} /> : "—"}
            phase={phase}
          />
          <BidForm />
          <div className="grid gap-6 md:grid-cols-2">
            <StatusPanel logs={fakeLogs} />
            <FaqPanel />
          </div>
        </section>
      </div>
    </main>
  );
}
