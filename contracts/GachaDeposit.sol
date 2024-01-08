// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract GachaDeposit is Ownable {
    struct Ticket {
        string gameId;
        uint amount;
        address tokenAddress;
        bool isUsed;
    }

    mapping(address => mapping(string => Ticket)) public userTickets;

    event BuyTicket(
        address indexed user,
        string indexed gameId,
        uint amount,
        address tokenAddress
    );

    event UseTicket(address indexed user, string indexed gameId);

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
        string memory _gameId,
        uint _amount,
        address _tokenAddress
    ) external payable {
        if (_tokenAddress == address(0)) {
            require(msg.value == _amount, "Fee is not fit!");
        } else {
            ERC20 token = ERC20(_tokenAddress);
            token.transferFrom(msg.sender, address(this), _amount);
        }
        userTickets[msg.sender][_gameId] = Ticket(
            _gameId,
            _amount,
            _tokenAddress,
            false
        );
        emit BuyTicket(msg.sender, _gameId, _amount, _tokenAddress);
    }

    function useTicket(string memory _gameId) external payable {
        string memory gameId = userTickets[msg.sender][_gameId].gameId;
        require(
            keccak256(abi.encodePacked(gameId)) !=
                keccak256(abi.encodePacked("")) &&
                userTickets[msg.sender][_gameId].isUsed == false,
            "Ticket is not valid"
        );
        userTickets[msg.sender][_gameId].isUsed = true;
        emit UseTicket(msg.sender, _gameId);
    }
}
