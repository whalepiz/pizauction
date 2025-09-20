import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface StatusPanelProps {
  logs: string[];
}

export default function StatusPanel({ logs }: StatusPanelProps) {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Status Updates</CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No updates yet...</p>
        ) : (
          <ul className="space-y-1">
            {logs.map((log, idx) => (
              <li key={idx} className="text-sm">✅ {log}</li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

