// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * FHE demo (placeholder):
 * - Lưu "giá bid" dưới dạng bytes (ciphertext/handle)
 * - Track danh sách người bid lần đầu (bidders[])
 * - finalize(): chọn winner là người bid CUỐI CÙNG (demo – chưa giải mã/so sánh)
 * - Giữ API đơn giản để FE tích hợp
 */
contract FHEAuction {
    string public item;
    uint256 public endTime;

    mapping(address => bytes) private bids;
    address[] private bidders;

    address public winner;
    bool public ended;

    event BidSubmitted(address indexed bidder, bytes encryptedAmount, uint256 timestamp);
    event AuctionEnded(address indexed winner, uint256 timestamp);

    constructor(string memory _item, uint256 _biddingDurationSeconds) {
        item = _item;
        endTime = block.timestamp + _biddingDurationSeconds;
    }

    function placeBid(bytes calldata encryptedAmount) external {
        require(block.timestamp < endTime, "Auction ended");
        if (bids[msg.sender].length == 0) {
            bidders.push(msg.sender);
        }
        bids[msg.sender] = encryptedAmount;
        emit BidSubmitted(msg.sender, encryptedAmount, block.timestamp);
    }

    // Demo finalize: chọn người bid CUỐI CÙNG
    function finalize() external {
        require(block.timestamp >= endTime, "Not yet");
        require(!ended, "Already ended");
        ended = true;

        if (bidders.length > 0) {
            winner = bidders[bidders.length - 1];
        } else {
            winner = address(0);
        }

        emit AuctionEnded(winner, block.timestamp);
    }

    function getBidCipher(address user) external view returns (bytes memory) {
        return bids[user];
    }

    // tiện cho FE test
    function biddersCount() external view returns (uint256) {
        return bidders.length;
    }
}
