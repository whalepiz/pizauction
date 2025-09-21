"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { connectWallet, placeEncryptedBid } from "@/lib/fhe";

export default function BidForm() {
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<"" | "pending" | "ok" | "err">("");
  const [msg, setMsg] = useState<string>("");

  async function onSubmit() {
    if (!amount) return;
    try {
      setStatus("pending"); setMsg("Encrypting & submitting your bid…");
      await connectWallet();
      await placeEncryptedBid(amount);
      setStatus("ok"); setMsg("Bid received — your encrypted bid is on-chain.");
      setAmount("");
    } catch (e: any) {
      console.error(e);
      setStatus("err");
      setMsg(e?.message || "Failed to submit bid.");
    }
  }

  return (
    <Card className="shadow-lg mt-6 bg-neutral-900/60 border-neutral-800">
      <CardHeader>
        <CardTitle className="text-xl">Place a Private Bid</CardTitle>
      </CardHeader>
      <CardContent>
        <label className="text-sm text-muted-foreground mb-1 block">
          Amount (ETH)
        </label>
        <Input
          type="number"
          placeholder="Enter bid amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mb-3"
          min="0"
          step="0.0001"
        />
        {status && (
          <p
            className={
              "text-sm " +
              (status === "ok"
                ? "text-emerald-400"
                : status === "err"
                ? "text-rose-400"
                : "text-neutral-300")
            }
          >
            {msg}
          </p>
        )}
        <p className="text-xs text-neutral-400 mt-2">
          We encrypt this value in-browser before submitting.
        </p>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={onSubmit} disabled={!amount || status === "pending"}>
          {status === "pending" ? "Submitting…" : "Submit Encrypted Bid"}
        </Button>
      </CardFooter>
    </Card>
  );
}
