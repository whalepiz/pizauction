"use client";

import { useState } from "react";
import { OnchainAuction, bidOnAuction } from "@/lib/fhe";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Countdown from "@/components/Countdown";

export default function AuctionCard({ a }: { a: OnchainAuction }) {
  const [amt, setAmt] = useState("");
  const [pending, setPending] = useState(false);
  const ends = a.endTimeMs;

  async function onBid() {
    if (!amt) return;
    try {
      setPending(true);
      await bidOnAuction(a.address, amt);
      setAmt("");
      alert("✅ Bid submitted!");
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Bid failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#0f1420] p-3 shadow-lg">
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-black/30 mb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={a.imageUrl || "https://picsum.photos/seed/fhe-nft/800/800"}
          alt={a.title || a.item}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="mb-1 text-sm text-white/70">
        Ends in <Countdown endTime={ends} />
      </div>
      <div className="text-base font-semibold">{a.title || a.item}</div>
      {a.description && (
        <div className="mt-1 text-xs text-white/60 line-clamp-2">{a.description}</div>
      )}

      <div className="mt-3 flex gap-2">
        <Input
          placeholder="Amount (ETH)"
          value={amt}
          onChange={(e) => setAmt(e.target.value)}
          type="number"
          min="0"
          step="0.0001"
          className="text-sm"
        />
        <Button onClick={onBid} disabled={!amt || pending} className="min-w-[70px]">
          {pending ? "..." : "Bid"}
        </Button>
      </div>
    </div>
  );
}
