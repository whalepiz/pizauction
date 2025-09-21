"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchBidHistory } from "@/lib/fhe";

type Row = { user: string; amount: string; timeMs: number };

function timeAgo(ms: number) {
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

export default function HistoryTable() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      // đọc logs thực sự từ RPC
      const data = await fetchBidHistory();
      setRows(data);
      // console.log("[history]", data);
    } catch (e: any) {
      setError(e?.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const onRefresh = () => load();
    window.addEventListener("bid:submitted", onRefresh); // bắn từ BidForm sau khi submit
    return () => window.removeEventListener("bid:submitted", onRefresh);
  }, []);

  return (
    <Card className="mt-6">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>📜 Bid History (on-chain)</CardTitle>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-rose-400 mb-2">{error}</p>}
        {!loading && rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No bids yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-300">
                <tr className="border-b border-gray-800">
                  <th className="py-2">User</th>
                  <th className="py-2">Amount</th>
                  <th className="py-2">When</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-gray-900/60">
                    <td className="py-2 font-mono text-gray-200">
                      {r.user.slice(0, 6)}…{r.user.slice(-4)}
                    </td>
                    <td className="py-2">
                      <span className="rounded-md bg-emerald-600/20 px-2 py-1 text-emerald-300">
                        {r.amount}
                      </span>
                    </td>
                    <td className="py-2 text-gray-400">{timeAgo(r.timeMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-gray-500">
          * Amounts stay encrypted (placeholder). Only final winner is revealed at the end.
        </p>
      </CardContent>
    </Card>
  );
}
