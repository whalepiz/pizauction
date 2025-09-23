"use client";

import { Toaster } from "sonner";
import {
  createWeb3Modal,
  defaultConfig
} from "@web3modal/ethers/react";

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID!;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 11155111);

// ---- cấu hình cho Ethers
const ethersConfig = defaultConfig({
  metadata: {
    name: "Private NFT Auctions",
    description: "Encrypted bids (FHE) + on-chain metadata",
    url: "https://pizauction.vercel.app",
    icons: ["https://pizauction.vercel.app/icon.png"]
  }
});

// ---- chain Sepolia
const chains = [
  {
    chainId: CHAIN_ID,
    name: "Sepolia",
    currency: "ETH",
    explorerUrl: "https://sepolia.etherscan.io",
    rpcUrl: RPC_URL
  }
];

// ---- chỉ khởi tạo 1 lần, tránh lỗi Fast Refresh
declare global {
  interface Window {
    __W3M_INIT__?: boolean;
  }
}

if (typeof window !== "undefined" && !window.__W3M_INIT__) {
  createWeb3Modal({
    ethersConfig,
    chains,
    projectId,
    enableInjected: true,      // MetaMask + ví cài trên browser
    enableEIP6963: true,       // phát hiện nhiều ví cùng lúc
    enableWalletConnect: true, // quét QR = WalletConnect
    enableCoinbase: true,      // Coinbase Wallet
    themeMode: "dark",
    enableAnalytics: false
  });
  window.__W3M_INIT__ = true;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster richColors closeButton />
    </>
  );
}
