// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract GachaDeposit is AccessControl {
    struct Game {
        uint id;
        uint fee;
        string dataHash;
        string provider;
        bool isEnded;
    }
    struct Ticket {
        uint gameId;
        bool isUsed;
    }

    Game[] public games;
    mapping(address => Ticket[]) public userTickets;

    uint private _gameIdCounter = 0;

    event InitGame(uint id, string dataHash, string provider);
    event BuyTicket(address indexed user, uint gameId);
    event CloseGame(uint gameId);

    // bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor() payable {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function initGame(
        string calldata _dataHash,
        string calldata _provider,
        uint fee
    ) external onlyRole(DEFAULT_ADMIN_ROLE) returns (uint id) {
        uint currentCounter = _gameIdCounter++;
        games.push(Game(currentCounter, fee, _dataHash, _provider, false));
        emit InitGame(currentCounter, _dataHash, _provider);
        _gameIdCounter++;
        return currentCounter;
    }

    function buyTicket(uint _gameId) external payable returns (bool status) {
        Game memory game = getGame(_gameId);
        require(game.isEnded == false, "Game is not valid!");
        require(game.fee == msg.value, "Fee is not fit!");

        userTickets[msg.sender].push(Ticket(_gameId, false));
        emit BuyTicket(msg.sender, _gameId);

        return true;
    }

    function getGame(uint _gameId) internal view returns (Game memory game) {
        for (uint i = 0; i < games.length; i++) {
            if (games[i].id == _gameId) {
                game = games[i];
                break;
            }
        }
        return game;
    }

    function closeGame(uint _gameId) public onlyRole(DEFAULT_ADMIN_ROLE) {
        Game memory game = getGame(_gameId);
        require(game.isEnded == false, "Game is ended!");
        for (uint i = 0; i < games.length; i++) {
            if (games[i].id == _gameId) {
                games[i].isEnded = true;
                emit CloseGame(_gameId);
                break;
            }
        }
    }
}
