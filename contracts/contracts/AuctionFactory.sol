// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./FHEAuction.sol";

/**
 * Deploy mỗi auction FHEAuction mới cho 1 NFT.
 * Lưu danh sách address và metadata tối thiểu để FE đọc nhanh.
 */
contract AuctionFactory {
    struct Info {
        string item;       // tên/nhãn NFT
        uint256 endTime;   // timestamp kết thúc (từ auction)
        address creator;   // người tạo
    }

    address[] public auctions;
    mapping(address => Info) public infoByAuction;

    event AuctionCreated(
        address indexed auction,
        string item,
        uint256 endTime,
        address indexed creator
    );

    function createAuction(string memory item, uint256 durationSeconds)
        external
        returns (address)
    {
        FHEAuction a = new FHEAuction(item, durationSeconds);
        address addr = address(a);

        auctions.push(addr);
        infoByAuction[addr] = Info({
            item: item,
            endTime: a.endTime(),
            creator: msg.sender
        });

        emit AuctionCreated(addr, item, a.endTime(), msg.sender);
        return addr;
    }

    function getAllAuctions() external view returns (address[] memory) {
        return auctions;
    }
}
