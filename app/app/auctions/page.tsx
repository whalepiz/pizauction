"use client";

import { useEffect, useState } from "react";
import { CONTRACT_ADDRESS } from "@/lib/fhe";
import { seedIfEmpty, getAuctions, Auction } from "@/lib/auctionStore";
import AuctionCard from "@/components/AuctionCard";
import CreateAuctionForm from "@/components/CreateAuctionForm";
import { Button } from "@/components/ui/button";

export default function AuctionsPage() {
  const [list, setList] = useState<Auction[]>([]);
  const [openCreate, setOpenCreate] = useState(false);

  const load = () => setList(getAuctions());

  useEffect(() => {
    seedIfEmpty(CONTRACT_ADDRESS);
    load();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white">
      <div className="mx-auto max-w-6xl px-5 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Live Private Auctions</h1>
          <Button variant="secondary" onClick={() => setOpenCreate((v) => !v)}>
            {openCreate ? "Close" : "Create Auction"}
          </Button>
        </div>

        {openCreate && (
          <div className="mt-6">
            <CreateAuctionForm defaultContract={CONTRACT_ADDRESS} />
          </div>
        )}

        <div className="mt-8 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((a) => (
            <AuctionCard key={a.id} a={a} />
          ))}
        </div>
      </div>
    </main>
  );
}

