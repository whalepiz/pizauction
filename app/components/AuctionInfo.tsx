import { ReactNode } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface AuctionInfoProps {
  totalBids: number;
  timeLeft: ReactNode;
  phase: "Bidding" | "Reveal" | "Closed";
}

export default function AuctionInfo({ totalBids, timeLeft, phase }: AuctionInfoProps) {
  const steps = ["Bidding", "Reveal", "Closed"];
  const currentIndex = steps.indexOf(phase);

  return (
    <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">FHE Private Auction</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-semibold">{timeLeft}</p>
            <p className="text-sm">⏳ Time Left</p>
          </div>
          <div>
            <p className="text-lg font-semibold">{totalBids}</p>
            <p className="text-sm">📊 Total Bids</p>
          </div>
          <div>
            <p className="text-lg font-semibold">{phase}</p>
            <p className="text-sm">🚀 Phase</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1">
            {steps.map((s, idx) => (
              <span
                key={s}
                className={idx === currentIndex ? "text-yellow-300 font-semibold" : "text-gray-300"}
              >
                {s}
              </span>
            ))}
          </div>
          <div className="h-2 bg-white/20 rounded-full">
            <div
              className="h-2 bg-yellow-400 rounded-full transition-all"
              style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
