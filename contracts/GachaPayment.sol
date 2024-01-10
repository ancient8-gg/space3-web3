// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract GachaPayment is Ownable {
    uint private fee;

    event BuyTicket(
        address indexed user,
        string indexed orderId,
        uint amount,
        address tokenAddress
    );

    constructor(uint _fee) Ownable(msg.sender) {
        fee = _fee;
    }

    function setFee(uint _fee) external onlyOwner {
        fee = _fee;
    }

    function getFee() external view onlyOwner returns (uint) {
        return fee;
    }

    function withdraw(address _tokenAddress) external onlyOwner {
        if (_tokenAddress == address(0)) {
            address payable _owner = payable(owner());
            _owner.transfer(address(this).balance);
        } else {
            ERC20 token = ERC20(_tokenAddress);
            uint balance = token.balanceOf(address(this));
            token.transfer(owner(), balance);
        }
    }

    function buyTicket(
        string memory _orderId,
        uint _amount,
        address _tokenAddress
    ) external payable {
        if (_tokenAddress == address(0)) {
            require(msg.value == _amount + fee, "Payment is not valid!");
        } else {
            require(msg.value == fee, "Payment is not valid!");
            ERC20 token = ERC20(_tokenAddress);
            token.transferFrom(msg.sender, address(this), _amount);
        }
        emit BuyTicket(msg.sender, _orderId, _amount, _tokenAddress);
    }
}
