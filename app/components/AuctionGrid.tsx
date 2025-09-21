"use client";

import { useEffect, useState } from "react";
import { Auction, getAuctions, onAuctionsChanged } from "@/lib/auctionStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Countdown from "@/components/Countdown";

export default function AuctionGrid() {
  const [list, setList] = useState<Auction[]>([]);

  const load = () => setList(getAuctions());
  useEffect(() => {
    load();
    const off = onAuctionsChanged(load);
    return off;
  }, []);

  if (!list.length) {
    return (
      <div className="w-full rounded-lg border border-zinc-800 bg-zinc-900/40 p-12 text-center text-sm text-zinc-400">
        No auctions yet. Click <strong>Create</strong> above to add the first one.
      </div>
    );
  }

  return (
    <div id="marketplace" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
      {list.map((a) => (
        <Card key={a.id} className="border-zinc-800 bg-zinc-950/60 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={a.imageUrl} alt={a.title} className="w-full h-40 object-cover border-b border-zinc-800" />
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="font-semibold truncate">{a.title}</div>
            <div className="text-xs text-zinc-400">Ends in: <Countdown endTime={a.endTimeMs} /></div>
            <Button
              className="mt-2"
              onClick={() => {
                const el = document.getElementById("bid-section");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              Bid
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
