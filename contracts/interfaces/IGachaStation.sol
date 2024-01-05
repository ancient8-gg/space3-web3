// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

/**
 * @dev Interface of the GachaStation
 */
interface IGachaStation {
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

    /* ============ Functions ============ */
    function setRewardOwner(
        address user,
        address tokenAddress,
        uint256 tokenId,
        uint256 amount,
        string memory tokenType
    ) external;

    function claim(uint256 index) external;
}
