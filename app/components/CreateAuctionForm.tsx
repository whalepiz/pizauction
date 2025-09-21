"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createAuctionOnChain } from "@/lib/fhe";
import { toast } from "sonner";

const FALLBACK_IMG = "https://picsum.photos/seed/placeholder/800/800";

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

  // preview helpers
  const [imgOk, setImgOk] = useState(true);
  const [imgLoading, setImgLoading] = useState(false);

  const canCreate = useMemo(
    () => title.trim().length > 0 && hours > 0,
    [title, hours]
  );
  const previewTitle = title.trim() || "Untitled NFT";
  const previewDesc = desc.trim() || "No description";
  const previewImg = imgOk && img ? img : FALLBACK_IMG;

  async function submit() {
    if (!canCreate || loading) return;
    try {
      setLoading(true);
      const created = await createAuctionOnChain(title.trim(), hours, img);
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
      // reset form
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
        {/* LEFT: form */}
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
            onChange={(e) => {
              setImg(e.target.value);
              setImgOk(true);
              setImgLoading(true);
            }}
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
              Bids are encrypted on client. On-chain contract remains the same
              (global bids) in this v1.
            </p>
          </div>
        </div>

        {/* RIGHT: live preview card */}
        <div className="relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-zinc-800 to-black">
          {/* Skeleton while loading */}
          {imgLoading && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-zinc-700/40 to-zinc-900/40" />
          )}

          <Image
            src={previewImg}
            alt="Preview"
            fill
            className="object-cover"
            onLoadingComplete={() => setImgLoading(false)}
            onError={() => {
              setImgOk(false);
              setImgLoading(false);
            }}
          />

          {/* gradient overlay for text readability */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/80 to-transparent" />

          {/* top-right badge */}
          <div className="absolute right-2 top-2 rounded-full bg-black/50 px-3 py-1 text-xs text-white/80 backdrop-blur">
            Preview
          </div>

          {/* bottom content */}
          <div className="absolute inset-x-3 bottom-3 space-y-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold">{previewTitle}</span>
              <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] text-white/80">
                {hours}h duration
              </span>
            </div>
            <p className="line-clamp-2 text-xs text-white/70">{previewDesc}</p>
          </div>

          {/* fallback badge if image missing */}
          {!imgOk && (
            <div className="absolute left-2 top-2 rounded-md bg-rose-600/80 px-2 py-0.5 text-[10px]">
              Image failed — showing placeholder
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
