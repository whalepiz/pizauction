"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OnchainAuction, bidOnAuction, ensureWallet } from "@/lib/fhe";
import { toast } from "sonner";

function useCountdown(end: number) {
  const [t, setT] = useState(() => Math.max(0, end - Date.now()));
  useEffect(() => {
    const id = setInterval(() => setT(Math.max(0, end - Date.now())), 1000);
    return () => clearInterval(id);
  }, [end]);
  const d = Math.floor(t / (24 * 3600_000));
  const h = Math.floor((t % (24 * 3600_000)) / 3600_000);
  const m = Math.floor((t % 3600_000) / 60_000);
  const s = Math.floor((t % 60_000) / 1000);
  return { d, h, m, s, finished: t <= 0 };
}

export default function AuctionCard({
  auction,
  onBid,
}: {
  auction: OnchainAuction;
  onBid?: () => void;
}) {
  const { d, h, m, s, finished } = useCountdown(auction.endTimeMs);
  const [amount, setAmount] = useState("");
  const endsIn = useMemo(() => {
    if (finished) return "Closed";
    const parts = [];
    if (d) parts.push(`${d}d`);
    parts.push(`${h}h`, `${m}m`, `${s}s`);
    return parts.join(" ");
  }, [d, h, m, s, finished]);

  async function handleBid() {
    if (!amount) return;
    try {
      await ensureWallet();
      const tx = await bidOnAuction(auction.address, amount);
      toast.success("Bid submitted", {
        description: (tx as any)?.hash ?? "On-chain transaction sent.",
        action: {
          label: "Etherscan",
          onClick: () =>
            window.open(
              `https://sepolia.etherscan.io/tx/${(tx as any)?.hash ?? ""}`,
              "_blank"
            ),
        },
      });
      setAmount("");
      onBid?.();
    } catch (e: any) {
      toast.error(e?.shortMessage || e?.message || "Bid failed");
    }
  }

  return (
    <div className="group rounded-2xl border border-white/10 bg-zinc-900/40 p-3 shadow-md transition-all hover:shadow-fuchsia-500/20 hover:border-fuchsia-400/30">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br from-zinc-800 via-zinc-900 to-black">
        {auction.imageUrl ? (
          <Image
            src={auction.imageUrl}
            alt={auction.item}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-white/40">
            No Image
          </div>
        )}
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="line-clamp-1 font-semibold tracking-tight">
            {auction.item}
          </h3>
          <span
            className={`rounded-md px-2 py-0.5 text-xs ${
              finished
                ? "bg-red-500/20 text-red-300"
                : "bg-emerald-500/15 text-emerald-300"
            }`}
          >
            {finished ? "Closed" : `Ends in ${endsIn}`}
          </span>
        </div>

        {/* Bid inline */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="Amount (ETH)"
            type="number"
            step="0.0001"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-black/30"
            disabled={finished}
          />
          <Button
            onClick={handleBid}
            disabled={!amount || finished}
            className="bg-gradient-to-r from-fuchsia-600 to-cyan-500 hover:opacity-90"
          >
            Bid
          </Button>
        </div>
      </div>
    </div>
  );
}
