"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { connectWallet, bidOnAuction } from "@/lib/fhe";
import { toast } from "sonner";

const DEFAULT_AUCTION = process.env.NEXT_PUBLIC_AUCTION_ADDRESS; // dùng contract mặc định nếu có

export default function BidForm() {
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    if (!amount) return;
    if (!DEFAULT_AUCTION) {
      toast.error("Missing NEXT_PUBLIC_AUCTION_ADDRESS (env).");
      return;
    }
    try {
      setBusy(true);
      await connectWallet();
      await bidOnAuction(DEFAULT_AUCTION, amount);
      toast.success("Bid submitted on-chain");
      setAmount("");
    } catch (e: any) {
      toast.error(e?.message || "Failed to submit bid");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="shadow-lg mt-6">
      <CardHeader>
        <CardTitle className="text-xl">Place a Private Bid</CardTitle>
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
        />
        {!DEFAULT_AUCTION && (
          <p className="text-xs text-amber-400">
            NOTE: Set <code>NEXT_PUBLIC_AUCTION_ADDRESS</code> in your env to enable this form.
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={onSubmit} disabled={!amount || busy || !DEFAULT_AUCTION}>
          {busy ? "Submitting…" : "Submit Encrypted Bid"}
        </Button>
      </CardFooter>
    </Card>
  );
}
