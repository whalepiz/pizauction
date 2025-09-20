"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import AuctionInfo from "@/components/AuctionInfo";
import BidForm from "@/components/BidForm";
import StatusPanel from "@/components/StatusPanel";
import FaqPanel from "@/components/FaqPanel";
import { connectWallet } from "@/lib/fhe";

export default function HomePage() {
  const [connected, setConnected] = useState(false);
  const fakeLogs = ["Auction started", "New bid submitted"];

  async function onConnect() {
    try { await connectWallet(); setConnected(true); } catch (e) { console.error(e); }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">⚡ FHE Private Auction</h1>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <a href="https://github.com/whalepiz/pizauction" target="_blank">Repo</a>
            </Button>
            <Button onClick={onConnect} className={connected ? "bg-emerald-500 hover:bg-emerald-400" : ""}>
              {connected ? "Wallet Connected" : "Connect Wallet"}
            </Button>
          </div>
        </header>

        <AuctionInfo totalBids={12} timeLeft="3h 20m" phase="Bidding" />
        <BidForm />
        <StatusPanel logs={fakeLogs} />
        <FaqPanel />
      </div>
    </main>
  );
}
