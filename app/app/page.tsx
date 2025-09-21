"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import AuctionInfo from "@/components/AuctionInfo";
import BidForm from "@/components/BidForm";
import StatusPanel from "@/components/StatusPanel";
import FaqPanel from "@/components/FaqPanel";
import HistoryTable from "@/components/HistoryTable";
import Countdown from "@/components/Countdown";
import { connectWallet, readAuctionState, fetchTotalBids } from "@/lib/fhe";

type Phase = "Bidding" | "Closed";

export default function HomePage() {
  const [connected, setConnected] = useState(false);
  const [endTimeMs, setEndTimeMs] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("Bidding");
  const [totalBids, setTotalBids] = useState<number>(0);
  const fakeLogs = ["Auction started", "New bid submitted"];

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
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white">
      {/* top bar */}
      <div className="mx-auto max-w-6xl px-5 py-6 flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <span className="text-yellow-400">⚡</span> FHE Private Auction
        </h1>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <a href="https://github.com/whalepiz/pizauction" target="_blank" rel="noreferrer">
              Repo
            </a>
          </Button>
          {/* ✅ thêm nút Marketplace */}
          <Button variant="outline" asChild>
            <a href="/auctions">Marketplace</a>
          </Button>
          <Button
            onClick={onConnect}
            className={connected ? "bg-emerald-500 hover:bg-emerald-400" : ""}
          >
            {connected ? "Wallet Connected" : "Connect Wallet"}
          </Button>
        </div>
      </div>

      {/* body */}
      <div className="mx-auto max-w-6xl px-5 pb-16 space-y-8">
        <AuctionInfo
          totalBids={totalBids}
          timeLeft={endTimeMs ? <Countdown endTime={endTimeMs} /> : "—"}
          phase={phase}
        />
        <BidForm />
        <HistoryTable />
        <div className="grid gap-6 md:grid-cols-2">
          <StatusPanel logs={fakeLogs} />
          <FaqPanel />
        </div>
      </div>
    </main>
  );
}
