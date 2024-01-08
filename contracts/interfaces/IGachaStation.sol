// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

/**
 * @dev Interface of the GachaStation
 */
interface IGachaStation {
    /* ============= Events ============== */
    event OwnerOf(
        uint256 id,
        uint256 tokenId,
        uint256 amount,
        address tokenAddr,
        address indexed user
    );
    event Claimed(
        uint256 id,
        uint256 tokenId,
        uint256 amount,
        address tokenAddr,
        address indexed user
    );

    /* ============ Functions ============ */
    function setRewardOwner(
        address user,
        address tokenAddr,
        uint256 tokenId,
        uint256 amount,
        string calldata tokenType
    ) external returns (uint256);

    function claim(uint256 idx) external;

    function isClaimed(uint256 idx) external view returns (bool);
}
