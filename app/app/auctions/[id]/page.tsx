"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getAuction, type Auction } from "@/lib/auctionStore";
import Countdown from "@/components/Countdown";
import { Button } from "@/components/ui/button";

export default function AuctionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<Auction | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const found = getAuction(String(id));
    setItem(found || null);
  }, [id]);

  const endsIn = useMemo(
    () => (item ? <Countdown endTime={item.endTimeMs} /> : "—"),
    [item]
  );

  if (!item) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white">
        <div className="mx-auto max-w-4xl px-5 py-10">
          <p className="text-sm text-muted-foreground">Auction not found.</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/auctions">Back to Marketplace</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white">
      <div className="mx-auto max-w-5xl px-5 py-8 grid gap-8 md:grid-cols-2">
        <div className="rounded-xl overflow-hidden border border-white/10">
          <img src={item.imageUrl} alt={item.title} className="w-full h-auto object-cover"/>
        </div>

        <div className="space-y-4">
          <h1 className="text-2xl md:text-3xl font-extrabold">{item.title}</h1>

          <div className="text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Ends in</span>
              <span className="font-semibold">{endsIn}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Contract</span>
              <code className="rounded bg-black/30 px-1.5 py-0.5">
                {item.contractAddress.slice(0,6)}…{item.contractAddress.slice(-4)}
              </code>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            {/* Điều hướng về trang / để đặt bid (phiên “thật”) */}
            <Button onClick={() => router.push("/")}>Bid now</Button>
            <Button variant="outline" asChild>
              <Link href="/auctions">Back to Marketplace</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
