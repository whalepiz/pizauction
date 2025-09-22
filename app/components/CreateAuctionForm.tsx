"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { createAuctionOnChain } from "@/lib/fhe";
import { toast } from "sonner";

export default function CreateAuctionForm({
  onCreated,
}: {
  onCreated?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [img, setImg] = useState("https://picsum.photos/seed/new/800/800");
  const [desc, setDesc] = useState("");
  const [hours, setHours] = useState<number>(6);
  const [loading, setLoading] = useState(false);

  const canCreate = useMemo(
    () => title.trim().length > 0 && hours > 0,
    [title, hours]
  );

  async function submit() {
    if (!canCreate || loading) return;
    try {
      setLoading(true);
      const created = await createAuctionOnChain(title.trim(), hours, img, desc);
      toast.success("Auction created", {
        description: `${created.item} @ ${created.address.slice(0, 10)}…`,
        action: {
          label: "Etherscan",
          onClick: () =>
            window.open(
              `https://sepolia.etherscan.io/address/${created.address}`,
              "_blank"
            ),
        },
      });
      setTitle("");
      setDesc("");
      setHours(6);
      onCreated?.();
    } catch (e: any) {
      toast.error(e?.shortMessage || e?.message || "Create failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 shadow-lg">
      <div className="grid gap-5 md:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          <Input
            placeholder="NFT title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-black/30"
          />
          <Input
            placeholder="Image URL (https://...)"
            value={img}
            onChange={(e) => setImg(e.target.value)}
            className="bg-black/30"
          />
          <Textarea
            placeholder="Description (optional)"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="bg-black/30"
          />
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min="1"
              step="1"
              value={hours}
              onChange={(e) => setHours(Number(e.target.value || 0))}
              className="w-28 bg-black/30"
            />
            <span className="text-sm text-white/60">hours</span>
          </div>

          <div className="pt-2">
            <Button
              onClick={submit}
              disabled={!canCreate || loading}
              className="w-full bg-gradient-to-r from-fuchsia-600 to-cyan-500 hover:opacity-90"
            >
              {loading ? "Creating…" : "Create Auction"}
            </Button>
            <p className="mt-2 text-xs text-white/50">
              Metadata (title, image, description) is stored on-chain via MetadataRegistry.
            </p>
          </div>
        </div>

        <div className="relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-zinc-800 to-black">
          <Image
            src={img || "https://picsum.photos/seed/placeholder/800/800"}
            alt="Preview"
            fill
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
