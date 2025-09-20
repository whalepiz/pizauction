// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * Minimal placeholder for FHE demo:
 * - Lưu "giá bid" dưới dạng bytes (ciphertext/handle)
 * - Không phụ thuộc thư viện FHE để tránh lỗi compile khác phiên bản
 * - Sau khi FE/flow chạy OK, ta sẽ nâng cấp lại về euint64 + verify proof theo SDK của Zama
 */
contract FHEAuction {
    string public item;
    uint256 public endTime;

    // Lưu ciphertext theo địa chỉ (dùng bytes để không đụng tới kiểu euint*)
    mapping(address => bytes) private bids;

    event BidSubmitted(address indexed bidder, uint256 timestamp);
    event AuctionEnded(uint256 timestamp);

    constructor(string memory _item, uint256 _biddingDurationSeconds) {
        item = _item;
        endTime = block.timestamp + _biddingDurationSeconds;
    }

    /// @notice Gửi "giá đã mã hoá" dưới dạng bytes
    function placeBid(bytes calldata encryptedAmount) external {
        require(block.timestamp < endTime, "Auction ended");
        bids[msg.sender] = encryptedAmount;
        emit BidSubmitted(msg.sender, block.timestamp);
    }

    /// @notice Kết thúc đấu giá (placeholder)
    function end() external {
        require(block.timestamp >= endTime, "Not yet");
        emit AuctionEnded(block.timestamp);
    }

    /// @notice Trả về ciphertext đã lưu (để FE/test xác nhận có dữ liệu)
    function getBidCipher(address user) external view returns (bytes memory) {
        return bids[user];
    }
}
