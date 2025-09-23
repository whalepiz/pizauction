"use client";

import { ReactNode, useEffect } from "react";
import { Toaster } from "sonner";
import {
  createWeb3Modal,
  defaultConfig,
  useWeb3ModalState,
} from "@web3modal/ethers/react";

// ====== WalletConnect config ======
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!;
const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 11155111);

// Sepolia (EVM)
const sepolia = {
  chainId,
  name: "Sepolia",
  currency: "ETH",
  explorerUrl: "https://sepolia.etherscan.io",
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.sepolia.org",
};

const metadata = {
  name: "FHE Private Auction",
  description: "Private-bid NFT auction dApp using Zama FHE",
  url: "https://pizauction.vercel.app",
  icons: ["https://pizauction.vercel.app/icon.png"],
};

export function Providers({ children }: { children: ReactNode }) {
  // Tạo Web3Modal một lần khi client mount
  useEffect(() => {
    if (!projectId) return;

    createWeb3Modal({
      ethersConfig: defaultConfig({ metadata }),
      chains: [sepolia],
      projectId,
      themeMode: "dark",
      themeVariables: {
        "--w3m-accent": "#7c3aed", // violet-600
        "--w3m-border-radius-master": "14px",
      },
    });
  }, []);

  // optional: lắng nghe state nếu cần
  useWeb3ModalState();

  return (
    <>
      {children}
      <Toaster position="top-right" />
    </>
  );
}
