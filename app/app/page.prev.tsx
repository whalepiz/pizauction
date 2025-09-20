"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Rocket, Shield, Lock, TimerReset, ArrowUpRight, Github, Play } from "lucide-react";
import { encryptBidBytes, getAuctionContract, connectWallet } from "@/lib/fhe";

export default function Page(){
  const [connected, setConnected] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [bidsCount, setBidsCount] = useState(0);
  const [txStatus, setTxStatus] = useState<null | "pending" | "success" | "error">(null);

  async function handleConnect(){
    try {
      await connectWallet();
      setConnected(true);
    } catch (e) {}
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
    } catch (e) {
      console.error(e);
      setTxStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-6">
        <div className="font-semibold">FHE Private Auction</div>
        <Button onClick={connected ? ()=>{} : handleConnect}>
          {connected ? "Wallet Connected" : "Connect Wallet"}
        </Button>
      </header>

      <main className="mx-auto max-w-5xl px-4">
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <div className="text-xl font-semibold">Place a Private Bid</div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePlaceBid} className="grid gap-4">
              <div>
                <Label htmlFor="amount">Amount (ETH)</Label>
                <Input id="amount" type="number" min="0" step="0.01"
                  value={amount}
                  onChange={(e)=>setAmount(e.target.value)} />
              </div>
              <Button type="submit" disabled={!connected || !amount}>Submit Encrypted Bid</Button>
            </form>
            {txStatus === "pending" && <Alert className="mt-4"><AlertTitle>Submitting…</AlertTitle></Alert>}
            {txStatus === "success" && <Alert className="mt-4 bg-emerald-500/10 border-emerald-500/40">
              <AlertTitle>Bid received</AlertTitle>
              <AlertDescription>Your encrypted bid is on-chain</AlertDescription>
            </Alert>}
            {txStatus === "error" && <Alert className="mt-4 bg-rose-500/10 border-rose-500/40">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Please retry</AlertDescription>
            </Alert>}
          </CardContent>
          <CardFooter className="text-sm text-white/60">
            Total bids submitted: {bidsCount}
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
