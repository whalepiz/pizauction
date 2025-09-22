// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * FHEAuction (v2, placeholder without real FHE):
 * - Giai đoạn 1 (Bidding): người dùng gửi "ciphertext" qua placeBid(bytes)
 *   -> ta chỉ lưu bytes & phát event BidSubmitted (để FE chứng minh có dữ liệu on-chain).
 * - Giai đoạn 2 (Reveal): sau endTime, người dùng gửi số bid thật (uint256) qua revealBid(uint256).
 *   -> Hợp đồng cập nhật current leader theo số bid lớn nhất đã reveal.
 * - Giai đoạn 3 (Finalize): bất kỳ ai gọi finalize() để chốt winner cuối cùng.
 *
 * Lưu ý: Đây là bản demo, chưa có verify proof FHE. Khi tích hợp FHEVM,
 * ta thay revealBid bằng logic giải mã/verify theo SDK của Zama.
 */
contract FHEAuction {
    // ----- public state -----
    string public item;
    uint256 public endTime;          // thời điểm kết thúc giai đoạn Bidding (giây)
    bool public finalized;           // đã chốt chưa

    // ----- bidding (ciphertext placeholder) -----
    mapping(address => bytes) private bids; // lưu ciphertext theo bidder

    // ----- reveal tracking -----
    mapping(address => uint256) public revealedAmount; // số đã reveal của mỗi bidder
    address public leader;             // hiện đang dẫn đầu (sau khi reveal)
    uint256 public leaderAmount;       // số bid đã reveal lớn nhất

    // lưu lịch sử reveal ngắn gọn cho FE (demo)
    struct Reveal {
        address bidder;
        uint256 amount;
        uint256 timestamp;
    }
    Reveal[] private reveals;          // append theo thời gian

    // ----- events -----
    event BidSubmitted(address indexed bidder, bytes encryptedAmount, uint256 timestamp);
    event BidRevealed(address indexed bidder, uint256 amount, uint256 timestamp);
    event AuctionFinalized(address indexed winner, uint256 amount, uint256 timestamp);

    constructor(string memory _item, uint256 _biddingDurationSeconds) {
        item = _item;
        endTime = block.timestamp + _biddingDurationSeconds;
    }

    // ====== Phase ======
    enum Phase { Bidding, Reveal, Closed }

    function currentPhase() public view returns (Phase) {
        if (finalized) return Phase.Closed;
        if (block.timestamp < endTime) return Phase.Bidding;
        // block.timestamp >= endTime && !finalized
        return Phase.Reveal;
    }

    modifier onlyPhase(Phase p) {
        require(currentPhase() == p, "Wrong phase");
        _;
    }

    // ====== Bidding (ciphertext placeholder) ======
    function placeBid(bytes calldata encryptedAmount) external onlyPhase(Phase.Bidding) {
        bids[msg.sender] = encryptedAmount;
        emit BidSubmitted(msg.sender, encryptedAmount, block.timestamp);
    }

    /// Trả về ciphertext đã lưu (để FE/test xác nhận có dữ liệu)
    function getBidCipher(address user) external view returns (bytes memory) {
        return bids[user];
    }

    // ====== Reveal ======
    /// Sau khi hết thời gian Bidding, người dùng gửi số bid gốc để "reveal".
    /// (Bản demo: không verify, chỉ nhận số và xếp hạng lớn nhất.)
    function revealBid(uint256 amount) external onlyPhase(Phase.Reveal) {
        require(amount > 0, "amount=0");
        revealedAmount[msg.sender] = amount;

        // update leader nếu cần
        if (amount > leaderAmount) {
            leaderAmount = amount;
            leader = msg.sender;
        }

        // push lịch sử (để FE đọc nhanh)
        reveals.push(Reveal({
            bidder: msg.sender,
            amount: amount,
            timestamp: block.timestamp
        }));

        emit BidRevealed(msg.sender, amount, block.timestamp);
    }

    // ====== Finalize ======
    /// Chốt winner (ai cũng có thể gọi), chỉ khi đang ở phase Reveal.
    function finalize() external onlyPhase(Phase.Reveal) {
        finalized = true;
        emit AuctionFinalized(leader, leaderAmount, block.timestamp);
    }

    // ====== View helpers cho FE ======
    /// Trả về leader hiện tại & số tiền (đã reveal)
    function getLeader() external view returns (address, uint256) {
        return (leader, leaderAmount);
    }

    /// Trả về n lịch sử reveal gần nhất (từ cuối mảng đi lùi)
    function getRecentReveals(uint256 n)
        external
        view
        returns (address[] memory bidders, uint256[] memory amounts, uint256[] memory timestamps)
    {
        uint256 len = reveals.length;
        if (n > len) n = len;
        bidders = new address[](n);
        amounts = new uint256[](n);
        timestamps = new uint256[](n);

        // lấy từ cuối mảng (mới nhất) lùi về
        for (uint256 i = 0; i < n; i++) {
            Reveal storage r = reveals[len - 1 - i];
            bidders[i] = r.bidder;
            amounts[i] = r.amount;
            timestamps[i] = r.timestamp;
        }
    }
}
