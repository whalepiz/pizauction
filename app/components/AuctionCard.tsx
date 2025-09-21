"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { bidOnAuction } from "@/lib/fhe";
import { toast } from "sonner";

type Props = {
  auction: {
    address: string;
    title?: string;
    item: string;
    imageUrl?: string;
    description?: string;
    endTimeMs: number;
  };
  onBid?: () => void;
};

export default function AuctionCard({ auction, onBid }: Props) {
  const [amt, setAmt] = useState("");
  const [loading, setLoading] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const left = useMemo(() => Math.max(0, auction.endTimeMs - Date.now()), [auction.endTimeMs]);
  const hh = Math.floor(left / 3600000);
  const mm = Math.floor((left % 3600000) / 60000);
  const ss = Math.floor((left % 60000) / 1000);

  async function submit() {
    if (!amt || loading) return;
    try {
      setLoading(true);
      await bidOnAuction(auction.address, amt);
      toast.success("Bid submitted", { description: `${amt} ETH → ${auction.title || auction.item}` });
      setAmt("");
      onBid?.();
    } catch (e: any) {
      toast.error(e?.shortMessage || e?.message || "Bid failed");
    } finally {
      setLoading(false);
    }
  }

  const imgSrc = !imgFailed && auction.imageUrl
    ? auction.imageUrl
    : "https://picsum.photos/seed/placeholder/600/600";

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-3 shadow-lg hover:border-white/20 transition">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl">
        <Image
          src={imgSrc}
          alt={auction.title || auction.item}
          fill
          onError={() => setImgFailed(true)}
          className="object-cover"
          sizes="(max-width:768px) 100vw, 25vw"
        />
        {/* overlay bottom */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
          <div className="text-sm font-semibold truncate">
            {auction.title || auction.item}
          </div>
          {auction.description ? (
            <div className="mt-0.5 text-xs text-white/70 line-clamp-2">{auction.description}</div>
          ) : null}
          <div className="mt-1 text-[11px] text-emerald-300/90">
            Ends in {hh}h {mm}m {ss}s
          </div>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <Input
          placeholder="Amount (ETH)"
          value={amt}
          onChange={(e) => setAmt(e.target.value)}
          className="bg-black/30"
        />
        <Button onClick={submit} disabled={!amt || loading}>
          {loading ? "Bidding…" : "Bid"}
        </Button>
      </div>
      <div className="mt-1 text-[11px] text-white/40">{auction.address.slice(0,6)}…{auction.address.slice(-4)}</div>
    </div>
  );
}
