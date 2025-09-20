import './globals.css';
export const metadata = { title: 'FHE Auction', description: 'Private Auction demo' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{margin:0}}>{children}</body>
    </html>
  );
}
