"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { bidOnAuction } from "@/lib/fhe";

function useCountdown(targetMs: number) {
  const [now, setNow] = useState(Date.now());
  useState(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  });
  const remain = Math.max(0, targetMs - now);
  const h = Math.floor(remain / 3600000);
  const m = Math.floor((remain % 3600000) / 60000);
  const s = Math.floor((remain % 60000) / 1000);
  return { h, m, s, finished: remain <= 0 };
}

export default function AuctionCard({
  address,
  title,
  endTimeMs,
  imageUrl
}: {
  address: string;
  title: string;
  endTimeMs: number;
  imageUrl?: string;
}) {
  const [amt, setAmt] = useState("");
  const [loading, setLoading] = useState(false);
  const { h, m, s, finished } = useCountdown(endTimeMs);

  async function onBid() {
    if (!amt || finished) return;
    try {
      setLoading(true);
      await bidOnAuction(address, amt);
      setAmt("");
      alert("✅ Bid submitted!");
    } catch (e: any) {
      console.error(e);
      alert(`❌ ${e?.message || "Bid failed"}`);
    } finally {
      setLoading(false);
    }
  }

  const img = useMemo(
    () =>
      imageUrl ??
      "https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=1200&auto=format&fit=crop",
    [imageUrl]
  );

  return (
    <Card className="bg-neutral-900/60 border-neutral-800 overflow-hidden hover:bg-neutral-900 transition">
      <div className="relative aspect-[4/3]">
        <Image src={img} alt={title} fill className="object-cover" />
      </div>
      <CardContent className="p-4 space-y-3">
        <div className="text-base font-semibold">{title}</div>
        <div className="text-xs text-neutral-400">
          Ends in <span className="text-white">{h}h {m}m {s}s</span>
        </div>

        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            step="0.0001"
            placeholder="Amount (ETH)"
            value={amt}
            onChange={(e) => setAmt(e.target.value)}
            className="flex-1 bg-neutral-800 text-sm rounded px-3 py-2 outline-none border border-neutral-700 focus:border-neutral-500"
            disabled={finished}
          />
          <Button onClick={onBid} disabled={!amt || finished || loading}>
            {finished ? "Closed" : loading ? "Submitting..." : "Bid"}
          </Button>
        </div>

        <div className="text-[10px] text-neutral-400 break-all">
          {address}
        </div>
      </CardContent>
    </Card>
  );
}
