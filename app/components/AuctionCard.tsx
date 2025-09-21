"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { encodeBid, bidOnAuction } from "@/lib/fhe";

type Props = {
  auction: {
    address: string;
    item: string;
    endTimeMs: number;
    imageUrl?: string;
    description?: string;
  };
  onBid?: () => void;
};

function shortAddr(a: string) {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
}

function Countdown({ end }: { end: number }) {
  const [now, setNow] = useState(Date.now());
  useState(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  });
  const diff = Math.max(0, end - now);
  const s = Math.floor(diff / 1000);
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return <span>{hh}h {mm}m {ss}s</span>;
}

export default function AuctionCard({ auction, onBid }: Props) {
  const [amt, setAmt] = useState("");
  const [busy, setBusy] = useState(false);

  const ended = useMemo(() => Date.now() >= auction.endTimeMs, [auction.endTimeMs]);
  const img = auction.imageUrl || "/no-image.png";

  async function submit() {
    if (!amt || ended) return;
    try {
      setBusy(true);
      // dùng encodeBid() như placeholder mã hoá ở client
      encodeBid(amt);
      await bidOnAuction(auction.address, amt);
      setAmt("");
      onBid?.();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={cn(
        "group relative rounded-2xl bg-gradient-to-b from-[#16191f] to-[#0c0f14]",
        "shadow-[0_20px_80px_-20px_rgba(0,0,0,0.45)] border border-white/10",
        "hover:shadow-[0_30px_100px_-20px_rgba(0,0,0,0.6)] transition-all duration-300"
      )}
    >
      {/* Media */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-t-2xl">
        <Image
          src={img}
          alt={auction.item || "NFT"}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, (max-width: 1400px) 33vw, 20vw"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute left-3 top-3 text-[11px] px-2 py-1 rounded-md bg-black/55 text-white/90 border border-white/10">
          {shortAddr(auction.address)}
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white/90 truncate pr-2">{auction.item || "Untitled"}</h3>
          <div className="text-[11px] text-emerald-300/90 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-400/20">
            {ended ? "Ended" : <>Ends in <Countdown end={auction.endTimeMs} /></>}
          </div>
        </div>

        {auction.description ? (
          <p className="mt-1 text-xs text-white/50 line-clamp-2">{auction.description}</p>
        ) : null}

        {/* Bid inline */}
        <div className="mt-3 flex items-center gap-2">
          <Input
            value={amt}
            onChange={(e) => setAmt(e.target.value)}
            placeholder="Amount (ETH)"
            type="number"
            min="0"
            step="0.0001"
            disabled={busy || ended}
            className="h-9 bg-white/5 border-white/10 text-white/90 placeholder:text-white/30"
          />
          <Button
            size="sm"
            disabled={!amt || busy || ended}
            onClick={submit}
            className="bg-gradient-to-r from-[#8a63ff] to-[#1ecad3] hover:opacity-95"
          >
            {busy ? "Bidding…" : "Bid"}
          </Button>
        </div>
      </div>
    </div>
  );
}
