// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

/**
 * @dev Interface of the GachaStation
 */
interface IGachaStation {
  /* ============== Error ============== */
  error AlreadyClaimed(uint256 id);
  error UnsupportedTokenType();

  /* ============= Events ============== */
  event TokenDeposited(
    address indexed depositor,
    address indexed token,
    uint256 tokenId,
    uint256 amount
  );
  event OwnershipGranted(uint256 id, address indexed owner);
  event Claimed(uint256 id, address indexed owner);
  event ERC721Received(
    address operator,
    address from,
    uint256 tokenId,
    bytes indexed data
  );
  event ERC1155Received(
    address operator,
    address from,
    uint256 id,
    uint256 value,
    bytes indexed data
  );
  event ERC1155BatchReceived(
    address operator,
    address from,
    uint256[] indexed ids,
    uint256[] indexed values,
    bytes indexed data
  );

  /* ============ Functions ============ */
  function deposit() external payable;

  function depositERC20(address token, uint256 amount) external;

  function depositERC721(address token, uint256 tokenId) external;

  function depositERC1155(
    address token,
    uint256 tokenId,
    uint256 amount
  ) external;

  function getRewardOwner(uint256 id) external view returns (address);

  function claim(uint256 id, address to) external;

  function isClaimed(uint256 id) external view returns (bool);
}
