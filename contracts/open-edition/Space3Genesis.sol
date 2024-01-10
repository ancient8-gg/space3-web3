// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract Space3Genesis is ERC721Enumerable {
    uint256 private _nextTokenId;
    string private _uri;
    uint256 public immutable startTime;
    uint256 public immutable endTime;

    constructor(
        string memory uri,
        uint256 startTime_,
        uint256 endTime_
    ) validPeriod(startTime_, endTime_) ERC721("Space3Genesis", "S11S") {
        _uri = uri;
        startTime = startTime_;
        endTime = endTime_;
    }

    modifier validPeriod(uint256 startTime_, uint256 endTime_) {
        require(startTime_ < endTime_, "Invalid public mint period");
        _;
    }

    modifier onlyInPublicMint() {
        require(
            block.timestamp >= startTime && block.timestamp < endTime,
            "Not in public mint period"
        );
        _;
    }

    function nextTokenId() public view returns (uint256) {
        return _nextTokenId;
    }

    function safeMint(address to) public onlyInPublicMint {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
    }

    // Same token URI for all tokens
    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721) returns (string memory) {
        super._requireOwned(tokenId);
        return _uri;
    }
}
