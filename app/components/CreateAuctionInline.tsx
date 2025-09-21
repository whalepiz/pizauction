"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAuctionOnChain } from "@/lib/fhe";

export default function CreateAuctionInline({
  onCreated
}: {
  onCreated?: (addr: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState(
    "https://images.unsplash.com/photo-1496963729609-8f6f1d1d5d88?q=80&w=1200&auto=format&fit=crop"
  );
  const [hours, setHours] = useState(6);
  const [submitting, setSubmitting] = useState(false);

  async function onCreate() {
    if (!title || hours <= 0) return;
    try {
      setSubmitting(true);
      const created = await createAuctionOnChain(title, hours, imageUrl);
      onCreated?.(created.address);
      alert(`✅ Created: ${created.address}`);
      setTitle("");
    } catch (e: any) {
      console.error(e);
      alert(`❌ ${e?.message || "Create failed"}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="bg-neutral-900/60 border-neutral-800">
      <CardHeader className="pb-2">
        <CardTitle>Create Auction</CardTitle>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <input
            placeholder="e.g. Genesis NFT #01"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-neutral-800 text-sm rounded px-3 py-2 outline-none border border-neutral-700 focus:border-neutral-500"
          />
          <input
            placeholder="Image URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full bg-neutral-800 text-sm rounded px-3 py-2 outline-none border border-neutral-700 focus:border-neutral-500"
          />
          <input
            type="number"
            min={1}
            step={1}
            placeholder="Duration (hours)"
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="w-full bg-neutral-800 text-sm rounded px-3 py-2 outline-none border border-neutral-700 focus:border-neutral-500"
          />
          <Button onClick={onCreate} disabled={!title || submitting}>
            {submitting ? "Creating..." : "Create"}
          </Button>
        </div>

        <div className="relative w-full h-48 md:h-full rounded overflow-hidden">
          <Image src={imageUrl} alt="preview" fill className="object-cover" />
        </div>
      </CardContent>
    </Card>
  );
}
