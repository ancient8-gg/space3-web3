// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

/**
 * @dev Interface of the GachaStation
 */
interface IGachaStation {
    /* ============= Structs ============= */
    struct Reward {
        uint256 tokenId;
        uint256 amount;
        address tokenAddr;
        string tokenType; // "ERC20", "ERC721", "ERC1155"
    }

    /* ============== Error ============== */
    error DupplicatedClaim(uint256 id);

    /* ============= Events ============== */
    event OwnerOf(uint256 id, address indexed owner, Reward indexed reward);
    event Claimed(uint256 id, address indexed owner, Reward indexed reward);

    /* ============ Functions ============ */
    function setRewardOwner(
        address owner,
        Reward memory reward
    ) external returns (uint256);

    function getRewardOwner(uint256 id) external view returns (address);

    function claim(uint256 id, address to) external;

    function isClaimed(uint256 id) external view returns (bool);
}
