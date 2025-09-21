"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAuction, Auction } from "@/lib/auctionStore";
import AuctionInfo from "@/components/AuctionInfo";
import BidForm from "@/components/BidForm";
import HistoryTable from "@/components/HistoryTable";
import Countdown from "@/components/Countdown";
import { Button } from "@/components/ui/button";

export default function AuctionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [a, setA] = useState<Auction | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    const item = getAuction(params.id);
    if (!item) {
      router.replace("/auctions");
      return;
    }
    setA(item);
  }, [params?.id, router]);

  if (!a) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white">
      <div className="mx-auto max-w-6xl px-5 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{a.title}</h1>
          <Button variant="outline" onClick={() => router.push("/auctions")}>Back</Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl overflow-hidden border border-slate-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.imageUrl} alt={a.title} className="w-full h-auto" />
          </div>

          <AuctionInfo
            totalBids={0 /* (tuỳ chọn) fetchTotalBids() */}
            timeLeft={<Countdown endTime={a.endTimeMs} />}
            phase={Date.now() < a.endTimeMs ? "Bidding" : "Closed"}
          />
        </div>

        <BidForm />
        <HistoryTable />
      </div>
    </main>
  );
}

