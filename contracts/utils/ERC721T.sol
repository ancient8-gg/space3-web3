// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract ERC721T is ERC721, ERC721Burnable, Ownable {
  constructor(
    string memory name,
    string memory symbol,
    address owner
  ) ERC721(name, symbol) Ownable(owner) {}

  function safeMint(address to, uint256 tokenId) public onlyOwner {
    _safeMint(to, tokenId);
  }
}
