// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "../interfaces/IGachaStation.sol";

contract GachaStation is IGachaStation, Ownable {
    using Address for address;

    uint256 private _rewardIdCounter = 0;
    mapping(uint256 => uint256) private _claimedBitMap;
    mapping(uint256 id => address) private _owners;
    mapping(uint256 id => Reward) private _rewards;

    /* =========== Constructor =========== */
    constructor(address initialOwner) Ownable(initialOwner) {}

    /* ============ Functions ============ */
    /**
     * @dev Function to set reward owner
     */
    function setRewardOwner(
        address owner,
        Reward memory reward
    ) external override onlyOwner returns (uint256) {
        uint256 id = _rewardIdCounter++;
        _rewards[id] = reward;
        _owners[id] = owner;
        emit OwnerOf(id, owner, reward);
        return id;
    }

    /**
     * @dev Function to claim reward by eligible user
     * @param id The index of reward
     */
    function claim(uint256 id, address to) external override {
        require(_owners[id] == to, "Not eligible!");

        if (isClaimed(id)) revert DupplicatedClaim(id);

        Reward memory reward = _rewards[id];
        _setClaimed(id);
        _distributeReward(to, reward);
        emit Claimed(id, to, reward);
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
            IERC20 token = IERC20(reward.tokenAddr);
            require(
                token.transferFrom(owner(), to, reward.amount),
                "Transfer failed"
            );
        } else if (
            keccak256(bytes(reward.tokenType)) == keccak256(bytes("ERC721"))
        ) {
            IERC721 token = IERC721(reward.tokenAddr);
            token.safeTransferFrom(owner(), to, reward.tokenId);
        } else if (
            keccak256(bytes(reward.tokenType)) == keccak256(bytes("ERC1155"))
        ) {
            IERC1155 token = IERC1155(reward.tokenAddr);
            token.safeTransferFrom(
                owner(),
                to,
                reward.tokenId,
                reward.amount,
                ""
            );
        }
    }

    function isClaimed(uint256 id) public view override returns (bool) {
        uint256 claimedWordIdx = id / 256;
        uint256 claimedBitIdx = id % 256;
        uint256 claimedWord = _claimedBitMap[claimedWordIdx];
        uint256 mask = (1 << claimedBitIdx);
        return claimedWord & mask == mask;
    }

    function getRewardOwner(
        uint256 id
    ) external view override returns (address) {
        return _owners[id];
    }

    function _setClaimed(uint256 index) private {
        uint256 claimedWordIdx = index / 256;
        uint256 claimedBitIdx = index % 256;
        _claimedBitMap[claimedWordIdx] =
            _claimedBitMap[claimedWordIdx] |
            (1 << claimedBitIdx);
    }

    receive() external payable {}

    fallback() external payable {}
}
