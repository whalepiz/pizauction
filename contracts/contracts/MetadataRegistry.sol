// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MetadataRegistry {
    struct Meta {
        string title;
        string imageUrl;
        string description;
        address creator;
        bool initialized;
    }

    mapping(address => Meta) private _meta;

    event MetadataSet(address indexed auction, string title, string imageUrl, string description, address indexed creator);

    /**
     * Set metadata cho một auction address. Chỉ set được 1 lần (idempotent optional).
     * - creator = msg.sender (thường là người vừa create auction)
     */
    function setMetadata(
        address auction,
        string calldata title,
        string calldata imageUrl,
        string calldata description
    ) external {
        Meta storage m = _meta[auction];
        require(!m.initialized, "Already set");
        m.title = title;
        m.imageUrl = imageUrl;
        m.description = description;
        m.creator = msg.sender;
        m.initialized = true;

        emit MetadataSet(auction, title, imageUrl, description, msg.sender);
    }

    function getMetadata(address auction) external view returns (
        string memory title,
        string memory imageUrl,
        string memory description,
        address creator,
        bool initialized
    ) {
        Meta storage m = _meta[auction];
        return (m.title, m.imageUrl, m.description, m.creator, m.initialized);
    }
}
