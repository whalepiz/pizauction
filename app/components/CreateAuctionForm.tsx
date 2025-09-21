"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Auction, createAuction } from "@/lib/auctionStore";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function CreateAuctionForm({
  defaultContract,
}: {
  defaultContract: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [img, setImg] = useState("");
  const [desc, setDesc] = useState("");
  const [hours, setHours] = useState(6);
  const [busy, setBusy] = useState(false);

  const onCreate = async () => {
    if (!title || !img || hours <= 0) return;
    setBusy(true);
    const end = Date.now() + hours * 3600 * 1000;
    const a = createAuction({
      title,
      imageUrl: img,
      description: desc,
      endTimeMs: end,
      contractAddress: defaultContract,
    } as Omit<Auction, "id" | "createdAt">);
    setBusy(false);
    router.push(`/auctions/${a.id}`);
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-4 space-y-3">
        <Input placeholder="NFT title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input placeholder="Image URL (https://...)" value={img} onChange={(e) => setImg(e.target.value)} />
        <Textarea placeholder="Description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} />
        <div className="flex items-center gap-3">
          <Input
            type="number"
            min={1}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="w-28"
          />
          <span className="text-sm text-slate-400">hours</span>
        </div>
        <div className="text-xs text-slate-400">
          Bids are encrypted on client. On-chain contract remains the same (global bids) in this v1.
        </div>
        <Button onClick={onCreate} disabled={busy || !title || !img}>Create Auction</Button>
      </CardContent>
    </Card>
  );
}

