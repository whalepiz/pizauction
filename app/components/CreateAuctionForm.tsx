"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createAuctionOnChain } from "@/lib/fhe";

export default function CreateAuctionForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [img, setImg] = useState("https://picsum.photos/seed/new/800/800");
  const [desc, setDesc] = useState("");
  const [hours, setHours] = useState<number>(6);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !hours || hours <= 0) return;
    try {
      setPending(true);
      await createAuctionOnChain(title, hours, img, desc);
      setTitle("");
      setDesc("");
      setImg("https://picsum.photos/seed/new/800/800");
      setHours(6);
      onCreated();
      alert("✅ Auction created!");
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Create failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-[1fr_360px]">
      <div className="space-y-3">
        <Input placeholder="NFT title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input placeholder="Image URL (https://…)" value={img} onChange={(e) => setImg(e.target.value)} />
        <Textarea placeholder="Description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} />
        <div className="flex items-center gap-3">
          <Input type="number" min="1" step="1" value={hours} onChange={(e) => setHours(Number(e.target.value))} className="w-24" />
          <span className="text-sm text-white/70">hours</span>
        </div>
        <Button type="submit" disabled={pending || !title || !hours} className="w-full md:w-auto">
          {pending ? "Creating…" : "Create Auction"}
        </Button>
        <p className="text-xs text-white/50">Bids are encrypted on client. On-chain contract remains the same (global bids) in this v1.</p>
      </div>

      <div className="hidden md:block rounded-lg overflow-hidden border border-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt="preview" className="h-full w-full object-cover" />
      </div>
    </form>
  );
}
