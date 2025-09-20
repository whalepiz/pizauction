import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Row = { user: string; amount: string; time: string };

const mockHistory: Row[] = [
  { user: "0x12a3…c9b1", amount: "2.00 ETH", time: "2m ago" },
  { user: "0x8fE4…1D32", amount: "1.20 ETH", time: "5m ago" },
  { user: "0xC9aa…77E0", amount: "0.85 ETH", time: "9m ago" },
  { user: "0x5a11…9Cde", amount: "1.75 ETH", time: "15m ago" },
];

export default function HistoryTable() {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>📜 Bid History (mock)</CardTitle>
      </CardHeader>
      <CardContent>
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
              {mockHistory.map((r, i) => (
                <tr key={i} className="border-b border-gray-900/60">
                  <td className="py-2">
                    <div className="inline-flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600/20 text-indigo-300 text-xs">
                        {r.user.slice(2, 4).toUpperCase()}
                      </span>
                      <span className="font-mono text-gray-200">{r.user}</span>
                    </div>
                  </td>
                  <td className="py-2">
                    <span className="rounded-md bg-emerald-600/20 px-2 py-1 text-emerald-300">
                      {r.amount}
                    </span>
                  </td>
                  <td className="py-2 text-gray-400">{r.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-gray-400">
          * Đây là dữ liệu mô phỏng để trình bày UI. On-chain thật có thể nối sau.
        </p>
      </CardContent>
    </Card>
  );
}

