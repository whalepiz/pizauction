# ⚡ FHE Private NFT Auctions  

A demo dApp for **Fully Homomorphic Encryption (FHE)** on Ethereum testnet, built for the **Zama Builder Track**.  

## 🚀 Overview  
FHE Private NFT Auctions allows users to create and participate in NFT auctions where **bids remain encrypted** until the auction ends. This ensures fairness, transparency, and privacy at the same time.  

- 🔐 **Encrypted bids (FHE-ready)** – amounts are hidden during the auction.  
- 🖼 **On-chain metadata** – NFT title, description, and image stored via `MetadataRegistry`.  
- 🌐 **Multi-wallet support** – connect with MetaMask, WalletConnect, Coinbase, etc.  
- 🕒 **Smart sorting** – auctions near expiry appear at the top, expired auctions move to the bottom.  
- 💻 **Full-stack** – Solidity smart contracts + Next.js 15 frontend.  

## 📂 Project Structure  
- **/contracts** – Solidity contracts (`AuctionFactory`, `FHEAuction`).  
- **/app** – Next.js frontend with wallet connection, auction creation form, and marketplace UI.  
- **/abis** – Contract ABIs for frontend integration.  

## 🔧 Installation  

```bash
# Clone repo
git clone https://github.com/whalepiz/pizauction.git
cd pizauction

# Install deps
npm install

# Run local dev
npm run dev
```

## 🔗 Demo Links  
- **Deployed dApp:** [pizauction.vercel.app](https://pizauction.vercel.app)  
- **GitHub Repo:** [github.com/whalepiz/pizauction](https://github.com/whalepiz/pizauction)  

## 📹 Demo Flow  
1. Connect wallet.  
2. Create an auction with NFT title, description, and image URL.  
3. Place encrypted bids.  
4. Finalize auction to reveal the winner.  

## 🏗 Tech Stack  
- [Solidity](https://soliditylang.org/)  
- [Next.js 15](https://nextjs.org/)  
- [ethers.js](https://docs.ethers.org/)  
- [Web3Modal](https://web3modal.com/)  
- [FHEVM](https://docs.zama.ai/)  
