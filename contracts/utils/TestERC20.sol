// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TestERC20 is ERC20, Ownable {
    constructor(
        address initialOwner
    ) ERC20("A8ERC20Test", "A8T") Ownable(initialOwner) {
        _mint(msg.sender, 10000000000000000000);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
