// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import {IERC721} from '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import {IERC721Receiver} from '@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol';
import {IERC1155} from '@openzeppelin/contracts/token/ERC1155/IERC1155.sol';
import {IERC1155Receiver} from '@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol';
import {Address} from '@openzeppelin/contracts/utils/Address.sol';
import {AccessControl} from '@openzeppelin/contracts/access/AccessControl.sol';

import {IGachaStation} from './interfaces/IGachaStation.sol';

contract GachaStation is IGachaStation, AccessControl {
  using Address for address;
  using SafeERC20 for IERC20;

  uint256 private _nextRewardId;
  mapping(uint256 => uint256) private _claimedBitMap;
  mapping(uint256 id => address) private _owners;
  mapping(uint256 id => Reward) public rewards;

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
  /**
   * @dev Function to set reward owner
   */
  function setRewardOwner(
    address owner,
    Reward calldata reward
  ) public onlyRole(DEFAULT_ADMIN_ROLE) returns (uint256) {
    // deposit resources
    _deposit(reward);

    // set reward owner
    uint256 id = _nextRewardId++;
    rewards[id] = reward;
    _owners[id] = owner;
    emit OwnershipGranted(id, owner);
    return id;
  }

  // Withdraw native token
  function withdraw(uint256 _amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(address(this).balance >= _amount, 'Not enough balance!');
    payable(msg.sender).transfer(_amount);
  }

  // Withdraw ERC-20
  function withdrawERC20(
    address _token,
    uint256 _amount
  ) external onlyRole(DEFAULT_ADMIN_ROLE) {
    IERC20 token = IERC20(_token);
    require(token.balanceOf(address(this)) >= _amount, 'Not enough balance!');
    token.safeTransfer(msg.sender, _amount);
  }

  // TODO: Withdraw ERC-721
  function withdrawERC721(
    address _token,
    uint256 _tokenId
  ) external onlyRole(DEFAULT_ADMIN_ROLE) {
    IERC721 token = IERC721(_token);
    require(token.ownerOf(_tokenId) == address(this), 'Not enough balance!');
    token.safeTransferFrom(address(this), msg.sender, _tokenId);
  }

  // TODO: Withdraw ERC-1155
  function withdrawERC1155(
    address _token,
    uint256 _tokenId,
    uint256 _amount
  ) external onlyRole(DEFAULT_ADMIN_ROLE) {
    IERC1155 token = IERC1155(_token);
    require(
      token.balanceOf(address(this), _tokenId) >= _amount,
      'Not enough balance!'
    );
    token.safeTransferFrom(address(this), msg.sender, _tokenId, _amount, '');
  }

  /**
   * @dev Function to claim reward by eligible user
   * @param id The index of reward
   * @param to The address to receive
   */
  function claim(uint256 id, address to) external override {
    require(_owners[id] == to, 'Not eligible!');

    if (isClaimed(id)) revert AlreadyClaimed(id);

    Reward memory reward = rewards[id];
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
  function _deposit(Reward memory reward) private {
    if (reward.tokenType == 0x0) {
      _depositEther(reward.amount);
    } else if (reward.tokenType == keccak256('ERC-20')) {
      _depositERC20(reward.tokenAddr, reward.amount);
    } else if (reward.tokenType == keccak256('ERC-721')) {
      _depositERC721(reward.tokenAddr, reward.tokenId);
    } else if (reward.tokenType == keccak256('ERC-1155')) {
      _depositERC1155(reward.tokenAddr, reward.tokenId, reward.amount);
    } else {
      revert UnsupportedTokenType();
    }
  }

  function _depositEther(uint256 amount) private {
    require(msg.value == amount, 'Incorrect amount of Ether sent!');
    emit TokenDeposited(msg.sender, address(0), 0, amount);
  }

  function _depositERC20(address _token, uint256 _amount) private {
    IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
    emit TokenDeposited(msg.sender, _token, 0, _amount);
  }

  function _depositERC721(address _token, uint256 _tokenId) private {
    IERC721(_token).safeTransferFrom(msg.sender, address(this), _tokenId);
    emit TokenDeposited(msg.sender, _token, _tokenId, 1);
  }

  function _depositERC1155(
    address _token,
    uint256 _tokenId,
    uint256 _amount
  ) private {
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
   * @dev Distributes rewards based on the reward type. Supports Ether, ERC20, ERC721, and ERC1155 tokens.
   * @param recipient The address to receive the reward.
   * @param reward The reward details.
   */
  function _distribute(address recipient, Reward memory reward) internal {
    if (reward.tokenType == 0x0) {
      _transferEther(recipient, reward.amount);
    } else if (reward.tokenType == keccak256('ERC-20')) {
      _transferERC20(reward.tokenAddr, recipient, reward.amount);
    } else if (reward.tokenType == keccak256('ERC-721')) {
      _transferERC721(reward.tokenAddr, recipient, reward.tokenId);
    } else if (reward.tokenType == keccak256('ERC-1155')) {
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
