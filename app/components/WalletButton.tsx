"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CHAIN_ID } from "@/lib/fhe";

/** rút gọn địa chỉ ví */
function short(addr: string) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

/** chuyển số chainId sang hex để wallet_switchEthereumChain */
function toHexChain(id: number) {
  return "0x" + id.toString(16);
}

export default function WalletButton() {
  const [account, setAccount] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // đọc tài khoản hiện tại & lắng nghe thay đổi từ MetaMask
  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth) return;

    // lấy sẵn nếu user đã connect từ trước
    eth.request({ method: "eth_accounts" })
      .then((accs: string[]) => {
        if (accs && accs[0]) setAccount(accs[0]);
      })
      .catch(() => {});

    // lắng nghe đổi tài khoản / chain
    const onAccounts = (accs: string[]) => setAccount(accs[0] ?? null);
    const onChain = async () => {
      try {
        const cid = await eth.request({ method: "eth_chainId" });
        if (parseInt(cid, 16) !== CHAIN_ID) {
          toast.warning(`Wrong network, please switch to chainId ${CHAIN_ID}`);
        }
      } catch {}
    };
    eth.on?.("accountsChanged", onAccounts);
    eth.on?.("chainChanged", onChain);

    return () => {
      eth.removeListener?.("accountsChanged", onAccounts);
      eth.removeListener?.("chainChanged", onChain);
    };
  }, []);

  async function ensureChain() {
    const eth = (window as any).ethereum;
    if (!eth) throw new Error("No wallet found");
    const chainIdHex = await eth.request({ method: "eth_chainId" });
    const cur = parseInt(chainIdHex, 16);
    if (cur !== CHAIN_ID) {
      // thử switch chain
      try {
        await eth.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: toHexChain(CHAIN_ID) }],
        });
      } catch (err: any) {
        // nếu chưa có chain trong wallet -> báo lỗi rõ ràng
        throw new Error(
          `Wrong network. Please add/switch to chainId ${CHAIN_ID} in your wallet.`,
        );
      }
    }
  }

  async function connect() {
    const eth = (window as any).ethereum;
    if (!eth) {
      toast.error("No wallet found. Please install MetaMask.");
      return;
    }
    setLoading(true);
    try {
      await ensureChain();
      const accs: string[] = await eth.request({ method: "eth_requestAccounts" });
      setAccount(accs[0]);
      toast.success("Wallet connected");
    } catch (e: any) {
      toast.error(e?.message || "Failed to connect");
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    if (!account) return;
    navigator.clipboard.writeText(account);
    toast.success("Address copied");
  }

  // Không có API “disconnect” chuẩn với MetaMask;
  // ta chỉ reset UI state để người dùng bấm Connect lại khi cần.
  function disconnect() {
    setAccount(null);
    toast.info("Disconnected (UI only)");
  }

  if (!account) {
    return (
      <Button onClick={connect} disabled={loading}>
        {loading ? "Connecting…" : "Connect Wallet"}
      </Button>
    );
  }

  // Đang connected: nút gọn + menu phụ copy / disconnect
  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" onClick={copy} title="Copy address">
        {short(account)}
      </Button>
      <Button variant="destructive" onClick={disconnect} title="Disconnect">
        Disconnect
      </Button>
    </div>
  );
}
