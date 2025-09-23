// app/app/providers.tsx
"use client";

import { Toaster } from "sonner";
import {
  createWeb3Modal,
  defaultConfig
} from "@web3modal/ethers/react";

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID!;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 11155111);

// Ethers config cho Web3Modal
const ethersConfig = defaultConfig({
  metadata: {
    name: "FHE Private Auction",
    description: "Private bidding dApp (FHEVM demo)",
    url: "https://pizauction.vercel.app",
    icons: ["https://avatars.githubusercontent.com/u/12365?v=4"] // bất kỳ icon hợp lệ
  }
});

// Chain cấu hình thủ công (Sepolia)
const chains = [
  {
    chainId: CHAIN_ID,
    name: "Sepolia",
    currency: "ETH",
    explorerUrl: "https://sepolia.etherscan.io",
    rpcUrl: RPC_URL
  }
];

// Tránh gọi createWeb3Modal nhiều lần
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
