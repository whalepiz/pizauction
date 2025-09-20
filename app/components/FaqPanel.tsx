import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function FaqPanel() {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>❓ FAQ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p><strong>🔒 Are bids private?</strong>  
        Yes, all bids are encrypted using Fully Homomorphic Encryption (FHE).</p>

        <p><strong>🏆 When is the winner revealed?</strong>  
        Only after the auction ends, ensuring fairness.</p>

        <p><strong>⚡ Can I place multiple bids?</strong>  
        Yes, the highest encrypted bid will be considered.</p>
      </CardContent>
    </Card>
  );
}

