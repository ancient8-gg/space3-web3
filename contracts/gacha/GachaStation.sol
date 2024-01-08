// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "../interfaces/IGachaStation.sol";

contract GachaStation is IGachaStation, Ownable {
    using Address for address;
    using SafeMath for uint256;
    using Counters for Counters.Counter;

    /* ============= Structs ============= */
    struct Reward {
        uint256 id;
        uint256 tokenId;
        uint256 amount;
        address tokenAddr;
        string tokenType; // "ERC20", "ERC721", "ERC1155"
    }

    Counters.Counter private _rewardIdCounter;
    mapping(address => Reward[]) private _rewards;
    mapping(uint256 => uint256) private _claimedBitMap;

    /* =========== Constructor =========== */
    constructor() {}

    /* ============ Functions ============ */
    /**
     * @dev Function to set reward owner
     */
    function setRewardOwner(
        address user,
        address tokenAddr,
        uint256 tokenId,
        uint256 amount,
        string calldata tokenType
    ) external override onlyOwner returns (uint256) {
        uint256 id = _rewardIdCounter.current();
        _rewardIdCounter.increment();
        Reward memory reward = Reward(
            id,
            tokenId,
            amount,
            tokenAddr,
            tokenType
        );
        _rewards[user].push(reward);
        emit OwnerOf(id, tokenId, amount, tokenAddr, msg.sender);
        return id;
    }

    /**
     * @dev Function to claim reward by eligible user
     * @param idx The index of reward
     */
    function claim(uint256 idx) external {
        require(!isClaimed(idx), "Already claimed!");
        Reward storage reward = _rewards[msg.sender][idx];
        _setClaimed(idx);
        _distributeReward(msg.sender, reward);
        emit Claimed(
            idx,
            reward.tokenId,
            reward.amount,
            reward.tokenAddr,
            msg.sender
        );
    }

    /**
     * @dev Function to distribute reward based on type
     * @param to The address to distribute reward to
     * @param reward The reward to distribute
     */
    function _distributeReward(address to, Reward memory reward) internal {
        if (reward.tokenAddr == address(0)) {
            payable(to).transfer(reward.amount);
        } else if (
            keccak256(bytes(reward.tokenType)) == keccak256(bytes("ERC20"))
        ) {
            require(
                IERC20(reward.tokenAddr).transfer(to, reward.amount),
                "Transfer failed"
            );
        } else if (
            keccak256(bytes(reward.tokenType)) == keccak256(bytes("ERC721"))
        ) {
            IERC721(reward.tokenAddr).safeTransferFrom(
                address(this),
                to,
                reward.tokenId
            );
        } else if (
            keccak256(bytes(reward.tokenType)) == keccak256(bytes("ERC1155"))
        ) {
            IERC1155(reward.tokenAddr).safeTransferFrom(
                address(this),
                to,
                reward.tokenId,
                reward.amount,
                ""
            );
        }
    }

    function isClaimed(uint256 idx) public view override returns (bool) {
        uint256 claimedWordIndex = idx / 256;
        uint256 claimedBitIndex = idx % 256;
        uint256 claimedWord = _claimedBitMap[claimedWordIndex];
        uint256 mask = (1 << claimedBitIndex);
        return claimedWord & mask == mask;
    }

    function _setClaimed(uint256 index) private {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        _claimedBitMap[claimedWordIndex] =
            _claimedBitMap[claimedWordIndex] |
            (1 << claimedBitIndex);
    }

    receive() external payable {}

    fallback() external payable {}
}
