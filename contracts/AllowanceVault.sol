// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract AllowanceVault {
    struct Cap {
        uint256 perHour;
        uint256 perDay;
        uint256 total;
    }

    address public owner;                 // buyer
    mapping(address => bool) public whitelist; // providers
    Cap public cap;
    bool public paused;

    event UpdatedCaps(uint256 perHour, uint256 perDay, uint256 total);
    event Whitelist(address indexed p, bool allowed);
    event Paused(bool);

    modifier onlyOwner(){
        require(msg.sender == owner, "!owner");
        _;
    }

    constructor(address _owner, Cap memory _cap){
        owner = _owner;
        cap = _cap;
    }

    function setCaps(Cap memory _cap) external onlyOwner {
        cap = _cap;
        emit UpdatedCaps(_cap.perHour, _cap.perDay, _cap.total);
    }

    function setWhitelist(address p, bool ok) external onlyOwner {
        whitelist[p] = ok;
        emit Whitelist(p, ok);
    }

    function pause(bool p) external onlyOwner {
        paused = p;
        emit Paused(p);
    }
}