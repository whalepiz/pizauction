"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createAuctionOnChain } from "@/lib/fhe";

type Props = {
  onCreated?: (auctionAddr: string) => void;
};

export default function CreateAuctionForm({ onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("https://picsum.photos/seed/new/800/800");
  const [desc, setDesc] = useState("");
  const [hours, setHours] = useState<number>(6);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");

  async function handleCreate() {
    if (!title || hours <= 0) {
      setMsg("Please enter title and duration > 0.");
      return;
    }
    try {
      setBusy(true);
      setMsg("Creating auction on-chain…");
      const created = await createAuctionOnChain(title, hours, imageUrl);
      setMsg("Created! Address: " + created.address);
      onCreated?.(created.address); // chỉ callback cho page refresh list — KHÔNG push route
      // reset form
      setTitle("");
      setDesc("");
      setHours(6);
    } catch (e: any) {
      console.error(e);
      setMsg(e?.message ?? "Create failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 p-5 space-y-3">
      <Input
        placeholder="NFT title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Input
        placeholder="Image URL (https://…)"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
      />
      <Textarea
        placeholder="Description (optional)"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
      />
      <div className="flex items-center gap-3">
        <Input
          type="number"
          min={1}
          value={hours}
          onChange={(e) => setHours(Number(e.target.value || 0))}
          className="w-28"
        />
        <span className="text-sm text-white/70">hours</span>
      </div>

      {msg && <p className="text-xs text-white/70">{msg}</p>}

      <Button onClick={handleCreate} disabled={busy} className="w-full">
        {busy ? "Creating…" : "Create Auction"}
      </Button>
      <p className="text-xs text-white/50">
        Bids are encrypted on client. On-chain contract remains the same (global bids) in this v1.
      </p>
    </div>
  );
}
