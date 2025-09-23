"use client";

import { useEffect, useState } from "react";

/**
 * WalletButton:
 * - Sử dụng web3modal → hỗ trợ nhiều loại ví (MetaMask, Coinbase, WalletConnect, OKX, Rabby...)
 * - Tự động hiển thị nút Connect/Disconnect đẹp mắt
 * - Không cần tự viết lại logic switch network như bản cũ
 */
export default function WalletButton() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // @ts-ignore web component của Web3Modal
  return <w3m-button size="sm" balance="hide" />;
}
