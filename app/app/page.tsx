"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { encryptBidBytes, getAuctionContract, connectWallet } from "@/lib/fhe";

export default function Page(){
  const [connected, setConnected] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [bidsCount, setBidsCount] = useState(0);
  const [txStatus, setTxStatus] = useState<null | "pending" | "success" | "error">(null);

  async function handleConnect(){
    try { await connectWallet(); setConnected(true); } catch {}
  }

  async function handlePlaceBid(e: React.FormEvent){
    e.preventDefault();
    setTxStatus("pending");
    try {
      const encBytes = await encryptBidBytes(amount || "0");
      const contract = await getAuctionContract();
      const tx = await contract.placeBid(encBytes);
      await tx.wait();
      setTxStatus("success");
      setBidsCount((c)=>c+1);
    } catch (e) { console.error(e); setTxStatus("error"); }
  }

  return (
    <div style={{minHeight:'100vh', background:'#0b1220', color:'#fff'}}>
      <header style={{maxWidth:960, margin:'0 auto', padding:'24px'}}>
        <h1 style={{margin:0}}>FHE Private Auction</h1>
        <Button onClick={connected?()=>{}:handleConnect} className="mt-3">
          {connected? "Wallet Connected":"Connect Wallet"}
        </Button>
      </header>
      <main style={{maxWidth:960, margin:'0 auto', padding:'0 24px 48px'}}>
        <Card className="bg-white/5 border-white/10">
          <CardHeader><div className="text-xl font-semibold">Place a Private Bid</div></CardHeader>
          <CardContent>
            <form onSubmit={handlePlaceBid} className="grid gap-4">
              <div>
                <Label htmlFor="amount">Amount (ETH)</Label>
                <Input id="amount" type="number" min="0" step="0.0001"
                  value={amount} onChange={(e)=>setAmount(e.target.value)} />
              </div>
              <Button type="submit" disabled={!connected || !amount}>Submit Encrypted Bid</Button>
            </form>
            {txStatus === "pending" && <Alert className="mt-4"><AlertTitle>Submitting…</AlertTitle></Alert>}
            {txStatus === "success" && <Alert className="mt-4 bg-emerald-500/10 border-emerald-500/40">
              <AlertTitle>Bid received</AlertTitle>
              <AlertDescription>Your encrypted bid is on-chain.</AlertDescription>
            </Alert>}
            {txStatus === "error" && <Alert className="mt-4 bg-rose-500/10 border-rose-500/40">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Please retry or reconnect wallet.</AlertDescription>
            </Alert>}
          </CardContent>
          <CardFooter className="text-sm text-white/60">Total bids submitted: {bidsCount}</CardFooter>
        </Card>
      </main>
    </div>
  );
}
