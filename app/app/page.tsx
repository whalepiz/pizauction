Tôi đang sửa đến phần này  
5) app/page.tsx (thay phần “Marketplace grid” để dùng AuctionCard)
đây là code cũ bạn thay cho tôi : 
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { connectWallet } from "@/lib/fhe";
import CreateAuctionForm from "@/components/CreateAuctionForm";
import AuctionCard from "@/components/AuctionCard";
import { getAuctions, Auction, seedIfEmpty } from "@/lib/auctionStore";

export default function HomePage() {
  const [connected, setConnected] = useState(false);
  const [auctions, setAuctions] = useState<Auction[]>([]);

  // Nạp dữ liệu mẫu cho Marketplace lần đầu (nếu rỗng) + lắng nghe thay đổi
  useEffect(() => {
    // dùng Auction address mặc định nếu có (không bắt buộc)
    seedIfEmpty(process.env.NEXT_PUBLIC_AUCTION_ADDRESS || "");
    setAuctions(getAuctions());

    // nếu tab khác tạo auction, tự refresh
    const onStorage = (e: StorageEvent) => {
      if (e.key === "fhe.auctions.v1") setAuctions(getAuctions());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const refresh = () => setAuctions(getAuctions());

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
        <CreateAuctionForm onCreated={refresh} />

        {/* Marketplace grid */}
        <section>
          <h2 className="text-xl font-semibold mb-3">Marketplace</h2>
          {auctions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No auctions yet. Create one above to get started.
            </p>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {auctions.map((a) => (
                <AuctionCard key={a.id} auction={a} onBid={refresh} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
