"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { connectWallet, placeEncryptedBid, readAuctionState } from "@/lib/fhe";

type Phase = "Bidding" | "Closed";

export default function BidForm() {
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<"" | "pending" | "ok" | "err">("");
  const [msg, setMsg] = useState<string>("");
  const [phase, setPhase] = useState<Phase>("Bidding");   // ← phase on-chain
  const [endTimeMs, setEndTimeMs] = useState<number | null>(null);

  // Load phase/endTime từ on-chain & auto refresh định kỳ
  useEffect(() => {
    let timer: any;
    const load = async () => {
      try {
        const s = await readAuctionState();
        setPhase(s.phase as Phase);
        setEndTimeMs(s.endTimeMs);
      } catch (e) {
        console.error(e);
      }
    };
    load();
    timer = setInterval(load, 30_000); // refresh mỗi 30s
    return () => clearInterval(timer);
  }, []);

  async function onSubmit() {
    if (!amount) return;
    if (phase !== "Bidding") {
      setStatus("err");
      setMsg("Auction is closed. You can no longer submit bids.");
      return;
    }
    try {
      setStatus("pending"); setMsg("Encrypting & submitting your bid…");
      await connectWallet();
      await placeEncryptedBid(amount);
      setStatus("ok"); setMsg("🎉 Bid received — your encrypted bid is on-chain.");
      setAmount("");
      // cho HistoryTable tự reload (nếu có)
      window.dispatchEvent(new Event("bid:submitted"));
    } catch (e: any) {
      console.error(e);
      setStatus("err");
      setMsg(e?.shortMessage || e?.message || "Failed to submit bid.");
    }
  }

  const isSubmitting = status === "pending";
  const disabled = !amount || isSubmitting || phase !== "Bidding";

  return (
    <Card className="shadow-lg mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Place a Private Bid</CardTitle>
          <span
            className={
              "rounded-full px-3 py-1 text-xs " +
              (phase === "Bidding"
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-rose-500/15 text-rose-300")
            }
            title={endTimeMs ? new Date(endTimeMs).toLocaleString() : ""}
          >
            {phase}
          </span>
        </div>
      </CardHeader>

      <CardContent>
        <label className="text-sm text-muted-foreground mb-1 block">Amount (ETH)</label>
        <Input
          type="number"
          placeholder="Enter bid amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mb-3"
          min="0"
          step="0.0001"
          disabled={phase !== "Bidding"}
        />

        {phase !== "Bidding" && (
          <p className="text-sm text-amber-300 mb-2">
            Auction has ended — submitting is disabled.
          </p>
        )}

        {status && (
          <p
            className={
              "text-sm " +
              (status === "ok"
                ? "text-emerald-400"
                : status === "err"
                ? "text-rose-400"
                : "text-muted-foreground")
            }
          >
            {msg}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          We encrypt this value in browser before submitting.
        </p>
      </CardContent>

      <CardFooter>
        <Button className="w-full" onClick={onSubmit} disabled={disabled}>
          {isSubmitting ? "Submitting…" : "Submit Encrypted Bid"}
        </Button>
      </CardFooter>
    </Card>
  );
}
