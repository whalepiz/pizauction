"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ensureWallet } from "@/lib/fhe";
import { Copy, LogOut } from "lucide-react";

function short(addr?: string | null) {
  if (!addr) return "";
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

export default function WalletButton() {
  const [address, setAddress] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function connect() {
    try {
      const provider = await ensureWallet(); // cũng tự check chain
      const accs = await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      });
      setAddress(accs?.[0] ?? null);
      toast.success("Wallet connected");
    } catch (e: any) {
      toast.error(e?.message || "Failed to connect wallet");
    }
  }

  function disconnect() {
    // MetaMask không hỗ trợ "disconnect" bằng code – mình chỉ xóa local state
    setAddress(null);
    setOpen(false);
    toast("Disconnected");
  }

  function copy() {
    if (!address) return;
    navigator.clipboard.writeText(address);
    toast.success("Address copied");
    setOpen(false);
  }

  // auto get current account nếu user đã connect trước đó
  useEffect(() => {
    (async () => {
      if ((window as any).ethereum) {
        const accs = await (window as any).ethereum.request({
          method: "eth_accounts",
        });
        if (accs?.[0]) setAddress(accs[0]);
      }
    })();
  }, []);

  // click outside close
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as any)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  if (!address) {
    return (
      <Button
        onClick={connect}
        className="bg-gradient-to-r from-fuchsia-600 to-cyan-500 hover:opacity-90 shadow-lg shadow-fuchsia-500/20"
      >
        Connect Wallet
      </Button>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <Button
        onClick={() => setOpen((v) => !v)}
        className="bg-zinc-800 hover:bg-zinc-700 border border-white/10"
      >
        {short(address)}
      </Button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl border border-white/10 bg-zinc-900/95 p-2 shadow-xl">
          <button
            onClick={copy}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-white/5"
          >
            <Copy className="h-4 w-4" /> Copy address
          </button>
          <button
            onClick={disconnect}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-red-300 hover:bg-red-400/10"
          >
            <LogOut className="h-4 w-4" /> Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
