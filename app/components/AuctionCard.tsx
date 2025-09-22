"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  bidOnAuction,
  revealOnAuction,
  finalizeAuction,
  readPhase,
  readLeader,
  fetchRevealHistory,
} from "@/lib/fhe";
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
  const [revealAmt, setRevealAmt] = useState("");
  const [loading, setLoading] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const [phase, setPhase] = useState<"Bidding" | "Reveal" | "Closed">("Bidding");
  const [leader, setLeader] = useState<{ addr: string; amt: number } | null>(null);
  const [history, setHistory] = useState<{ user: string; amount: number; timeMs: number }[]>([]);

  // đồng hồ đếm ngược
  const left = useMemo(() => Math.max(0, auction.endTimeMs - Date.now()), [auction.endTimeMs]);
  const hh = Math.floor(left / 3600000);
  const mm = Math.floor((left % 3600000) / 60000);
  const ss = Math.floor((left % 60000) / 1000);

  async function refresh() {
    try {
      const p = await readPhase(auction.address);
      setPhase(p);
      setLeader(await readLeader(auction.address));
      setHistory(await fetchRevealHistory(auction.address, 5));
    } catch {}
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 15000); // refresh mỗi 15s để khỏi phải F5
    return () => clearInterval(id);
  }, [auction.address]);

  async function submitBid() {
    if (!amt || loading || phase !== "Bidding") return;
    try {
      setLoading(true);
      await bidOnAuction(auction.address, amt);
      toast.success("Bid submitted", {
        description: `${amt} ETH → ${auction.title || auction.item}`,
      });
      setAmt("");
      onBid?.();
      refresh();
    } catch (e: any) {
      toast.error(e?.shortMessage || e?.message || "Bid failed");
    } finally {
      setLoading(false);
    }
  }

  async function submitReveal() {
    if (!revealAmt || loading || phase !== "Reveal") return;
    try {
      setLoading(true);
      await revealOnAuction(auction.address, revealAmt);
      toast.success("Reveal submitted", { description: `${revealAmt} ETH` });
      setRevealAmt("");
      refresh();
    } catch (e: any) {
      toast.error(e?.shortMessage || e?.message || "Reveal failed");
    } finally {
      setLoading(false);
    }
  }

  async function doFinalize() {
    if (loading || phase !== "Closed") return;
    try {
      setLoading(true);
      await finalizeAuction(auction.address);
      toast.success("Auction finalized");
      refresh();
    } catch (e: any) {
      toast.error(e?.shortMessage || e?.message || "Finalize failed");
    } finally {
      setLoading(false);
    }
  }

  const imgSrc = !imgFailed && auction.imageUrl
    ? auction.imageUrl
    : "https://picsum.photos/seed/placeholder/600/600";

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-3 shadow-lg hover:border-white/20 transition">
      {/* Ảnh & info */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl">
        <Image
          src={imgSrc}
          alt={auction.title || auction.item}
          fill
          onError={() => setImgFailed(true)}
          className="object-cover"
          sizes="(max-width:768px) 100vw, 25vw"
        />
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
          <div className="text-sm font-semibold truncate">
            {auction.title || auction.item}
          </div>
          {auction.description ? (
            <div className="mt-0.5 text-xs text-white/70 line-clamp-2">
              {auction.description}
            </div>
          ) : null}
          <div className="mt-1 text-[11px] text-emerald-300/90">
            Ends in {hh}h {mm}m {ss}s • <span className="text-white/70">{phase}</span>
          </div>
          {leader ? (
            <div className="mt-1 text-[11px] text-amber-300/90">
              Leader: {leader.addr.slice(0, 6)}… ({leader.amt} ETH)
            </div>
          ) : (
            <div className="mt-1 text-[11px] text-white/50">No leader yet</div>
          )}
        </div>
      </div>

      {/* Action theo phase */}
      {phase === "Bidding" && (
        <div className="mt-3 flex gap-2">
          <Input
            placeholder="Amount (ETH)"
            value={amt}
            onChange={(e) => setAmt(e.target.value)}
            className="bg-black/30"
          />
          <Button onClick={submitBid} disabled={!amt || loading}>
            {loading ? "Bidding…" : "Bid"}
          </Button>
        </div>
      )}

      {phase === "Reveal" && (
        <div className="mt-3 space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Reveal amount (ETH)"
              value={revealAmt}
              onChange={(e) => setRevealAmt(e.target.value)}
              className="bg-black/30"
            />
            <Button onClick={submitReveal} disabled={!revealAmt || loading}>
              {loading ? "Revealing…" : "Reveal"}
            </Button>
          </div>
          {history.length > 0 ? (
            <ul className="text-[11px] text-white/60 space-y-1">
              {history.map((h, i) => (
                <li key={i}>
                  {h.user.slice(0, 6)}… revealed {h.amount} at{" "}
                  {new Date(h.timeMs).toLocaleTimeString()}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-[11px] text-white/40">No reveals yet</div>
          )}
        </div>
      )}

      {phase === "Closed" && (
        <div className="mt-3 space-y-2">
          <Button onClick={doFinalize} disabled={loading} className="w-full">
            {loading ? "Finalizing…" : "Finalize"}
          </Button>
          {leader ? (
            <div className="text-sm text-emerald-400">
              Winner: {leader.addr.slice(0, 6)}… — {leader.amt} ETH
            </div>
          ) : (
            <div className="text-sm text-white/60">No winner</div>
          )}
        </div>
      )}

      <div className="mt-1 text-[11px] text-white/40">
        {auction.address.slice(0, 6)}…{auction.address.slice(-4)}
      </div>
    </div>
  );
}
