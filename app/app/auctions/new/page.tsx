"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createAuction } from "@/lib/auctionStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NewAuctionPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("https://picsum.photos/seed/new/800/800");
  const [hours, setHours] = useState<number>(6);
  const [submitting, setSubmitting] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault(); // tránh reload trang
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const endTimeMs = Date.now() + Math.max(1, Number(hours)) * 3600 * 1000;
      const item = createAuction({
        title: title.trim(),
        imageUrl: imageUrl.trim(),
        contractAddress: process.env.NEXT_PUBLIC_AUCTION_ADDRESS || "",
        endTimeMs,
      });
      router.push(`/auctions/${item.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white">
      <div className="mx-auto max-w-xl px-5 py-10">
        <h1 className="text-2xl font-bold mb-5">Create Auction</h1>
        <form className="space-y-3" onSubmit={onSubmit}>
          <label className="text-sm">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Genesis NFT #01"
          />

          <label className="text-sm">Image URL</label>
          <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />

          <label className="text-sm">Duration (hours)</label>
          <Input
            type="number"
            min={1}
            max={168}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
          />

          <Button className="w-full mt-3" type="submit" disabled={submitting || !title.trim()}>
            {submitting ? "Creating..." : "Create"}
          </Button>
        </form>
      </div>
    </main>
  );
}
