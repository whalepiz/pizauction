import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface AuctionInfoProps {
  totalBids: number;
  timeLeft: string;
  phase: string;
}

export default function AuctionInfo({ totalBids, timeLeft, phase }: AuctionInfoProps) {
  return (
    <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">FHE Private Auction</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-lg font-semibold">{timeLeft}</p>
          <p className="text-sm">Time Left</p>
        </div>
        <div>
          <p className="text-lg font-semibold">{totalBids}</p>
          <p className="text-sm">Total Bids</p>
        </div>
        <div>
          <p className="text-lg font-semibold">{phase}</p>
          <p className="text-sm">Phase</p>
        </div>
      </CardContent>
    </Card>
  );
}
