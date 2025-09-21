"use client";

import Image from "next/image";
import Link from "next/link";
import { Auction } from "@/lib/auctionStore";
import { Card, CardContent } from "@/components/ui/card";
import Countdown from "@/components/Countdown";

export default function AuctionCard({ a }: { a: Auction }) {
  return (
    <Link href={`/auctions/${a.id}`} className="group">
      <Card className="overflow-hidden bg-gradient-to-br from-slate-900 to-black border-slate-800 hover:border-slate-700 transition">
        <div className="relative aspect-square overflow-hidden">
          {/* dùng Image nếu muốn tối ưu; ở đây dùng img đơn giản để tránh domain config */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={a.imageUrl}
            alt={a.title}
            className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform"
          />
          <div className="absolute bottom-2 left-2 rounded-full bg-black/70 px-3 py-1 text-xs text-white">
            <Countdown endTime={a.endTimeMs} />
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold">{a.title}</h3>
          <p className="mt-1 text-xs text-slate-400">
            Contract: {a.contractAddress.slice(0, 6)}…{a.contractAddress.slice(-4)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

