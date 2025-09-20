/** ==== Đọc lịch sử thật từ on-chain qua event BidSubmitted ==== */
export async function fetchBidHistory(fromBlock?: number, toBlock?: number) {
  if (!RPC_URL) throw new Error("Missing NEXT_PUBLIC_RPC_URL");
  const provider = new JsonRpcProvider(RPC_URL);

  const iface = new Interface(ABI);

  // Tạo filter thủ công: chỉ cần tên event + ABI
  const filter = {
    address: CONTRACT_ADDRESS,
    topics: [
      iface.getEvent("BidSubmitted(address,bytes,uint256)").topicHash,
    ],
    fromBlock: fromBlock ?? 0,
    toBlock: toBlock ?? "latest",
  };

  const logs: Log[] = await provider.getLogs(filter);

  return logs
    .map((l) => {
      const parsed = iface.parseLog(l);
      const bidder: string = parsed.args[0];       // address
      // const enc: string = parsed.args[1];       // bytes (encryptedAmount)
      const timestamp: bigint = parsed.args[2];    // uint256
      return {
        user: bidder,
        amount: "(encrypted)",
        timeMs: Number(timestamp) * 1000,
      };
    })
    .sort((a, b) => b.timeMs - a.timeMs);
}
