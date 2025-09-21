"use client";

import { useState } from "react";
import { createAuction } from "@/lib/auctionStore";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  defaultContract: string;
};

export default function CreateAuctionInline({ defaultContract }: Props) {
  const [title, setTitle] = useState("");
  const [img, setImg] = useState("https://picsum.photos/seed/new/800/800");
  const [hours, setHours] = useState(6);
  const [loading, setLoading] = useState(false);

  const onCreate = async () => {
    if (!title || !img || hours <= 0) return;
    setLoading(true);
    try {
      const endTimeMs = Date.now() + hours * 3600 * 1000;
      createAuction({
        title,
        imageUrl: img,
        endTimeMs,
        contractAddress: defaultContract,
      });
      // reset
      setTitle("");
      setImg("https://picsum.photos/seed/new/800/800");
      setHours(6);
      // scroll tới marketplace
      const el = document.getElementById("marketplace");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-zinc-800 bg-zinc-950/60">
      <CardHeader>
        <CardTitle className="text-xl">Create Auction</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="col-span-2">
          <label className="text-sm text-muted-foreground mb-1 block">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Genesis NFT #01" />
          <label className="text-sm text-muted-foreground mb-1 block mt-4">Image URL</label>
          <Input value={img} onChange={(e) => setImg(e.target.value)} placeholder="https://..." />
          <label className="text-sm text-muted-foreground mb-1 block mt-4">Duration (hours)</label>
          <Input type="number" min={1} value={hours} onChange={(e) => setHours(Number(e.target.value || 1))} />
        </div>
        <div className="rounded-lg overflow-hidden ring-1 ring-zinc-800">
          {/* preview ảnh */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt="preview" className="w-full h-full object-cover" />
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={onCreate} disabled={loading || !title}>
          {loading ? "Creating..." : "Create"}
        </Button>
      </CardFooter>
    </Card>
  );
}
