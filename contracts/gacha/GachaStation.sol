// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol';
import '@openzeppelin/contracts/token/ERC1155/IERC1155.sol';
import '@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol';
import '@openzeppelin/contracts/utils/Address.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';

import './interfaces/IGachaStation.sol';

contract GachaStation is
  IGachaStation,
  AccessControl,
  IERC721Receiver,
  IERC1155Receiver
{
  using Address for address;
  using SafeERC20 for IERC20;

  uint256 private _nextRewardId;
  mapping(uint256 => uint256) private _claimedBitMap;
  mapping(uint256 id => address) private _owners;
  mapping(uint256 id => Reward) private _rewards;

  /* =========== Constructor =========== */
  constructor(address admin) {
    _grantRole(DEFAULT_ADMIN_ROLE, admin);
  }

  /* ============= Structs ============= */
  struct Reward {
    uint256 amount;
    uint256 tokenId;
    address tokenAddr;
    bytes32 tokenType; // "ERC20", "ERC721", "ERC1155"
  }

  /* ============ Functions ============ */
  function deposit() external payable override {
    emit TokenDeposited(msg.sender, address(0), 0, msg.value);
  }

  function depositERC20(address _token, uint256 _amount) external override {
    IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
    emit TokenDeposited(msg.sender, _token, 0, _amount);
  }

  function depositERC721(address _token, uint256 _tokenId) external override {
    IERC721(_token).safeTransferFrom(msg.sender, address(this), _tokenId);
    emit TokenDeposited(msg.sender, _token, _tokenId, 1);
  }

  function depositERC1155(
    address _token,
    uint256 _tokenId,
    uint256 _amount
  ) external override {
    IERC1155(_token).safeTransferFrom(
      msg.sender,
      address(this),
      _tokenId,
      _amount,
      ''
    );
    emit TokenDeposited(msg.sender, _token, _tokenId, _amount);
  }

  /**
   * @dev Function to set reward owner
   */
  function setRewardOwner(
    address owner,
    Reward calldata reward
  ) external onlyRole(DEFAULT_ADMIN_ROLE) returns (uint256) {
    uint256 id = _nextRewardId++;
    _rewards[id] = reward;
    _owners[id] = owner;
    emit OwnershipGranted(id, owner);
    return id;
  }

  /**
   * @dev Function to claim reward by eligible user
   * @param id The index of reward
   * @param to The address to receive
   */
  function claim(uint256 id, address to) external override {
    require(_owners[id] == to, 'Not eligible!');

    if (isClaimed(id)) revert AlreadyClaimed(id);

    Reward memory reward = _rewards[id];
    _setClaimed(id);
    _distribute(to, reward);
    emit Claimed(id, to);
  }

  function isClaimed(uint256 id) public view override returns (bool) {
    uint256 claimedWordIdx = id / 256;
    uint256 claimedBitIdx = id % 256;
    uint256 claimedWord = _claimedBitMap[claimedWordIdx];
    uint256 mask = (1 << claimedBitIdx);
    return claimedWord & mask == mask;
  }

  function getRewardOwner(uint256 id) external view override returns (address) {
    return _owners[id];
  }

  function onERC721Received(
    address operator,
    address from,
    uint256 tokenId,
    bytes calldata data
  ) external override returns (bytes4) {
    emit ERC721Received(operator, from, tokenId, data);
    return IERC721Receiver.onERC721Received.selector;
  }

  function onERC1155Received(
    address operator,
    address from,
    uint256 id,
    uint256 value,
    bytes calldata data
  ) external override returns (bytes4) {
    emit ERC1155Received(operator, from, id, value, data);
    return IERC1155Receiver.onERC1155Received.selector;
  }

  function onERC1155BatchReceived(
    address operator,
    address from,
    uint256[] calldata ids,
    uint256[] calldata values,
    bytes calldata data
  ) external override returns (bytes4) {
    emit ERC1155BatchReceived(operator, from, ids, values, data);
    return IERC1155Receiver.onERC1155BatchReceived.selector;
  }

  /* ============ Private Functions ============ */
  /**
   * @dev Distributes rewards based on the reward type. Supports Ether, ERC20, ERC721, and ERC1155 tokens.
   * @param recipient The address to receive the reward.
   * @param reward The reward details.
   */
  function _distribute(address recipient, Reward memory reward) internal {
    if (reward.tokenAddr == address(0)) {
      _transferEther(recipient, reward.amount);
    } else if (reward.tokenType == keccak256('ERC20')) {
      _transferERC20(reward.tokenAddr, recipient, reward.amount);
    } else if (reward.tokenType == keccak256('ERC721')) {
      _transferERC721(reward.tokenAddr, recipient, reward.tokenId);
    } else if (reward.tokenType == keccak256('ERC1155')) {
      _transferERC1155(
        reward.tokenAddr,
        recipient,
        reward.tokenId,
        reward.amount
      );
    } else {
      revert UnsupportedTokenType();
    }
  }

  function _transferEther(address recipient, uint256 amount) private {
    require(address(this).balance >= amount, 'Insufficient Ether balance');
    payable(recipient).transfer(amount);
  }

  function _transferERC20(
    address tokenAddr,
    address recipient,
    uint256 amount
  ) private {
    IERC20 token = IERC20(tokenAddr);
    require(token.balanceOf(address(this)) >= amount, 'Insufficient balance!');
    token.transfer(recipient, amount);
  }

  function _transferERC721(
    address tokenAddr,
    address recipient,
    uint256 tokenId
  ) private {
    IERC721 token = IERC721(tokenAddr);
    require(token.ownerOf(tokenId) == address(this), 'Insufficient balance!');
    token.safeTransferFrom(address(this), recipient, tokenId);
  }

  function _transferERC1155(
    address tokenAddr,
    address recipient,
    uint256 tokenId,
    uint256 amount
  ) private {
    IERC1155 token = IERC1155(tokenAddr);
    require(
      token.balanceOf(address(this), tokenId) >= amount,
      'Insufficient balance!'
    );
    token.safeTransferFrom(address(this), recipient, tokenId, amount, '');
  }

  function _setClaimed(uint256 index) private {
    uint256 claimedWordIdx = index / 256;
    uint256 claimedBitIdx = index % 256;
    _claimedBitMap[claimedWordIdx] =
      _claimedBitMap[claimedWordIdx] |
      (1 << claimedBitIdx);
  }
}
