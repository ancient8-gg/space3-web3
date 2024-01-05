// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "../interfaces/IGachaStation.sol";

contract GachaStation is IGachaStation, Ownable {
    using Address for address;
    using SafeMath for uint256;

    /* ============= Structs ============= */
    struct Reward {
        address tokenAddress;
        uint256 tokenId;
        uint256 amount;
        string tokenType; // "ERC20", "ERC721", "ERC1155"
        bool isClaimed;
    }

    mapping(address => Reward[]) private _rewards;

    /* ============= Events ============== */
    event OwnerOf(
        address indexed user,
        address tokenAddress,
        uint256 tokenId,
        uint256 amount
    );
    event Claimed(
        address indexed user,
        address tokenAddress,
        uint256 tokenId,
        uint256 amount
    );

    /* =========== Constructor =========== */
    constructor() {}

    /* ============ Functions ============ */
    /**
     * @dev Function to set reward owner
     */
    function setRewardOwner(
        address user,
        address tokenAddress,
        uint256 tokenId,
        uint256 amount,
        string memory tokenType
    ) public override onlyOwner {
        Reward memory reward = Reward(
            tokenAddress,
            tokenId,
            amount,
            tokenType,
            false
        );
        _rewards[user].push(reward);
        emit OwnerOf(msg.sender, tokenAddress, tokenId, amount);
    }

    /**
     * @dev Function to claim reward by eligible user
     * @param index The index of reward
     */
    function claim(uint256 index) external {
        require(index < _rewards[msg.sender].length, "Invalid reward!");
        require(!_rewards[msg.sender][index].isClaimed, "Already claimed!");

        Reward storage reward = _rewards[msg.sender][index];
        reward.isClaimed = true;
        _distributeReward(msg.sender, reward);

        emit Claimed(
            msg.sender,
            reward.tokenAddress,
            reward.tokenId,
            reward.amount
        );
    }

    /**
     * @dev Function to distribute reward based on type
     * @param to The address to distribute reward to
     * @param reward The reward to distribute
     */
    function _distributeReward(address to, Reward memory reward) internal {
        if (keccak256(bytes(reward.tokenType)) == keccak256(bytes("ERC20"))) {
            require(
                IERC20(reward.tokenAddress).transfer(to, reward.amount),
                "Transfer failed"
            );
        } else if (
            keccak256(bytes(reward.tokenType)) == keccak256(bytes("ERC721"))
        ) {
            IERC721(reward.tokenAddress).safeTransferFrom(
                address(this),
                to,
                reward.tokenId
            );
        } else if (
            keccak256(bytes(reward.tokenType)) == keccak256(bytes("ERC1155"))
        ) {
            IERC1155(reward.tokenAddress).safeTransferFrom(
                address(this),
                to,
                reward.tokenId,
                reward.amount,
                ""
            );
        }
    }

    receive() external payable {}

    fallback() external payable {}
}
