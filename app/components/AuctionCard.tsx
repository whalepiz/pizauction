"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { bidOnAuction, finalizeAuction, getWinner } from "@/lib/fhe";
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
  const [loading, setLoading] = useState<"" | "bid" | "finalize">("");
  const [imgFailed, setImgFailed] = useState(false);
  const [winner, setWinner] = useState<string>("");

  // countdown
  const leftMs = Math.max(0, auction.endTimeMs - Date.now());
  const hh = Math.floor(leftMs / 3600000);
  const mm = Math.floor((leftMs % 3600000) / 60000);
  const ss = Math.floor((leftMs % 60000) / 1000);
  const isClosed = leftMs <= 0;

  // load winner nếu đã có
  useEffect(() => {
    let cancel = false;
    async function loadWinner() {
      try {
        const w = await getWinner(auction.address);
        if (!cancel) setWinner(w || "");
      } catch {
        /* ignore */
      }
    }
    loadWinner();
    // Nếu chưa có winner và đã đóng, poll nhẹ vài lần
    if (isClosed && !winner) {
      const id = setInterval(loadWinner, 6000);
      return () => {
        cancel = true;
        clearInterval(id);
      };
    }
    return () => {
      cancel = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auction.address, isClosed]);

  async function submitBid() {
    if (!amt || loading) return;
    try {
      setLoading("bid");
      await bidOnAuction(auction.address, amt);
      toast.success("Bid submitted", {
        description: `${amt} ETH → ${auction.title || auction.item}`,
      });
      setAmt("");
      onBid?.();
    } catch (e: any) {
      toast.error(e?.shortMessage || e?.message || "Bid failed");
    } finally {
      setLoading("");
    }
  }

  async function onFinalize() {
    if (loading || !isClosed) return;
    try {
      setLoading("finalize");
      const tx = await finalizeAuction(auction.address);
      // hỗ trợ cả trường hợp finalize() trả về tx có .wait()
      if (tx?.wait) {
        await tx.wait();
      }
      toast.success("Auction finalized");
      const w = await getWinner(auction.address);
      setWinner(w || "");
      onBid?.();
    } catch (e: any) {
      toast.error(e?.shortMessage || e?.message || "Finalize failed");
    } finally {
      setLoading("");
    }
  }

  const imgSrc =
    !imgFailed && auction.imageUrl
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
            <div className="mt-0.5 text-xs text-white/70 line-clamp-2">
              {auction.description}
            </div>
          ) : null}
          {!isClosed ? (
            <div className="mt-1 text-[11px] text-emerald-300/90">
              Ends in {hh}h {mm}m {ss}s
            </div>
          ) : (
            <div className="mt-1 text-[11px] text-rose-300/90">Closed</div>
          )}
        </div>
      </div>

      {/* Winner status */}
      {winner ? (
        <div className="mt-3 text-xs text-emerald-400">
          Winner: {winner.slice(0, 6)}…{winner.slice(-4)}
        </div>
      ) : isClosed ? (
        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-white/60">No winner yet</div>
          <Button
            size="sm"
            onClick={onFinalize}
            disabled={loading === "finalize"}
          >
            {loading === "finalize" ? "Finalizing…" : "Finalize"}
          </Button>
        </div>
      ) : null}

      {/* Bid form */}
      {!isClosed && (
        <>
          <div className="mt-3 flex gap-2">
            <Input
              placeholder="Amount (ETH)"
              value={amt}
              onChange={(e) => setAmt(e.target.value)}
              className="bg-black/30"
            />
            <Button onClick={submitBid} disabled={!amt || loading === "bid"}>
              {loading === "bid" ? "Bidding…" : "Bid"}
            </Button>
          </div>
          <div className="mt-1 text-[11px] text-white/40">
            {auction.address.slice(0, 6)}…{auction.address.slice(-4)}
          </div>
        </>
      )}
    </div>
  );
}
