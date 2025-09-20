"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import AuctionInfo from "@/components/AuctionInfo";
import BidForm from "@/components/BidForm";
import StatusPanel from "@/components/StatusPanel";
import FaqPanel from "@/components/FaqPanel";
import HistoryTable from "@/components/HistoryTable";
import Countdown from "@/components/Countdown";
import { connectWallet } from "@/lib/fhe";

export default function HomePage() {
  const [connected, setConnected] = useState(false);
  const fakeLogs = ["Auction started", "New bid submitted"];

  // cho demo: kết thúc sau 3 giờ tính từ lúc mở trang
  const auctionEnd = Date.now() + 3 * 60 * 60 * 1000;

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
          <Button onClick={onConnect} className={connected ? "bg-emerald-500 hover:bg-emerald-400" : ""}>
            {connected ? "Wallet Connected" : "Connect Wallet"}
          </Button>
        </div>
      </div>

      {/* body */}
      <div className="mx-auto max-w-6xl px-5 pb-16 space-y-8">
        {/* hero info */}
        <AuctionInfo
          totalBids={12}
          timeLeft={<Countdown endTime={auctionEnd} />}
          phase="Bidding"
        />

        {/* bid form */}
        <BidForm />

        {/* history mock */}
        <HistoryTable />

        {/* status + faq */}
        <div className="grid gap-6 md:grid-cols-2">
          <StatusPanel logs={fakeLogs} />
          <FaqPanel />
        </div>
      </div>
    </main>
  );
}
