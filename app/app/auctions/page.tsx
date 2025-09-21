"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { seedIfEmpty, getAuctions, type Auction } from "@/lib/auctionStore";
import Countdown from "@/components/Countdown";
import { Button } from "@/components/ui/button";

/**
 * Trang Marketplace: đọc auctions từ localStorage (client-only).
 * - seedIfEmpty: tạo dữ liệu mẫu lần đầu dựa trên NEXT_PUBLIC_AUCTION_ADDRESS
 * - Không gọi localStorage khi SSR => tránh crash trắng trang
 * - Có nút Refresh để re-load
 */
export default function AuctionsPage() {
  const [items, setItems] = useState<Auction[]>([]);
  const [ready, setReady] = useState(false);

  const load = () => {
    // chỉ chạy trên client
    const list = getAuctions();
    setItems(list);
  };

  useEffect(() => {
    // seed dữ liệu mẫu nếu chưa có
    const addr = process.env.NEXT_PUBLIC_AUCTION_ADDRESS || "";
    try {
      seedIfEmpty(addr);
    } catch {}
    load();
    setReady(true);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white">
      <div className="mx-auto max-w-6xl px-5 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Marketplace
          </h1>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={load}>Refresh</Button>
            <Button asChild>
              <Link href="/auctions/new">Create Auction</Link>
            </Button>
          </div>
        </div>

        {!ready ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-white/10 p-10 text-center">
            <p className="text-lg font-medium">No auctions yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Click “Create Auction” to add the first one.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((a) => (
              <article
                key={a.id}
                className="group overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.02] shadow-sm hover:shadow-2xl hover:border-white/20 transition-all"
              >
                <Link href={`/auctions/${a.id}`} className="block">
                  {/* Dùng <img> để tránh config domain Next/Image */}
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={a.imageUrl}
                      alt={a.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="px-4 py-4 space-y-2">
                    <h3 className="text-lg font-semibold line-clamp-1">{a.title}</h3>

                    {a.description ? (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {a.description}
                      </p>
                    ) : null}

                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Ends in</span>
                      {/* Countdown client-side (an toàn vì đã ready) */}
                      <span className="font-medium">
                        <Countdown endTime={a.endTimeMs} />
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Contract</span>
                      <code className="rounded bg-black/30 px-1.5 py-0.5">
                        {a.contractAddress.slice(0, 6)}…{a.contractAddress.slice(-4)}
                      </code>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
