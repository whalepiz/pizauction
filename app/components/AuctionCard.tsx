"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import Countdown from "@/components/Countdown";

export type CardAuction = {
  address: string;
  item: string;
  endTimeMs: number;
  imageUrl?: string;
};

type Props = {
  auction: CardAuction;
  onSelect?: (addr: string) => void;  // dùng để set target cho BidForm ở trang chính
};

export default function AuctionCard({ auction, onSelect }: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/50 overflow-hidden flex flex-col">
      <div className="relative aspect-[4/3] w-full bg-black/40">
        {/* KHÔNG có Link/href sang /auctions/[id] nữa */}
        {auction.imageUrl ? (
          <Image
            src={auction.imageUrl}
            alt={auction.item}
            fill
            className="object-cover"
            sizes="(min-width: 768px) 20vw, 50vw"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-white/40 text-sm">
            No image
          </div>
        )}
      </div>

      <div className="p-3 space-y-2">
        <div className="text-sm font-semibold">{auction.item}</div>
        <div className="text-xs text-white/70">
          Ends in <Countdown endTime={auction.endTimeMs} />
        </div>
        <Button
          size="sm"
          className="w-full mt-2"
          onClick={() => onSelect?.(auction.address)}
        >
          Bid
        </Button>
      </div>
    </div>
  );
}
