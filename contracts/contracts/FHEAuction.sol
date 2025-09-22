// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * Demo FHE-style auction (placeholder, không giải mã):
 * - Lưu "bids" dạng bytes (ciphertext/handle) cho mỗi địa chỉ
 * - Tính "điểm" (score) từ 4 byte đầu (phù hợp FE encodeBid 4 byte)
 * - Chọn winner = bidder có score cao nhất
 * - Có trạng thái ended + winner + finalize()
 */
contract FHEAuction {
    string public item;
    uint256 public endTime;

    mapping(address => bytes) private bids;
    mapping(address => bool) private hasBid;
    address[] private bidderList;

    bool public ended;
    address public winner;
    uint256 public highestScore;

    event BidSubmitted(address indexed bidder, bytes encryptedAmount, uint256 timestamp);
    event AuctionEnded(uint256 timestamp, address indexed winner, uint256 highestScore);

    constructor(string memory _item, uint256 _biddingDurationSeconds) {
        item = _item;
        endTime = block.timestamp + _biddingDurationSeconds;
    }

    /// @dev Trích 4 byte đầu làm "điểm" (phù hợp encodeBid FE)
    function _score(bytes memory enc) internal pure returns (uint256 s) {
        if (enc.length < 4) return 0;
        // lấy 32 bytes đầu của 'enc' (dữ liệu bytes được left-aligned trong 32 bytes đầu)
        bytes32 word;
        assembly {
            word := mload(add(enc, 32))
        }
        // lấy 4 byte cao nhất: dịch phải 224 bit
        s = uint256(word) >> 224;
    }

    /// @notice Gửi "giá mã hoá" (bytes)
    function placeBid(bytes calldata encryptedAmount) external {
        require(block.timestamp < endTime, "Auction ended");

        // lưu ciphertext
        bids[msg.sender] = encryptedAmount;

        // ghi danh bidder nếu là lần đầu
        if (!hasBid[msg.sender]) {
            hasBid[msg.sender] = true;
            bidderList.push(msg.sender);
        }

        // cập nhật "điểm" cao nhất + winner (không giải mã, chỉ so sánh bytes)
        uint256 sc = _score(encryptedAmount);
        if (sc > highestScore) {
            highestScore = sc;
            winner = msg.sender;
        }

        emit BidSubmitted(msg.sender, encryptedAmount, block.timestamp);
    }

    /// @notice Kết thúc (alias của finalize để tương thích)
    function end() external {
        _finalize();
    }

    /// @notice Finalize: chốt winner và đánh dấu ended
    function finalize() external {
        _finalize();
    }

    function _finalize() internal {
        require(block.timestamp >= endTime, "Not yet");
        require(!ended, "Already ended");
        ended = true;
        emit AuctionEnded(block.timestamp, winner, highestScore);
    }

    /// @notice Xem ciphertext đã lưu cho 1 user (hỗ trợ kiểm thử)
    function getBidCipher(address user) external view returns (bytes memory) {
        return bids[user];
    }

    /// @notice Số lượng bidder duy nhất
    function getBiddersCount() external view returns (uint256) {
        return bidderList.length;
    }
}
