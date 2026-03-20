// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Vote {
    struct Candidate {
        string name;
        uint256 voteCount;
    }

    address public owner;
    Candidate[] private candidates;
    mapping(address => uint256) public lastVoteTime;
    uint256 public constant COOLDOWN = 3 minutes;

    event Voted(address indexed voter, uint256 candidateIndex);

    constructor() {
        owner = msg.sender;
        candidates.push(Candidate("Leon Blum", 0));
        candidates.push(Candidate("Jacques Chirac", 0));
        candidates.push(Candidate("Francois Mitterrand", 0));
    }

    function getCandidatesCount() external view returns (uint256) {
        return candidates.length;
    }

    function getCandidate(uint256 index) external view returns (string memory name, uint256 voteCount) {
        require(index < candidates.length, "Index invalide");
        return (candidates[index].name, candidates[index].voteCount);
    }

    function getTimeUntilNextVote(address voter) external view returns (uint256) {
        if (lastVoteTime[voter] == 0) return 0;
        uint256 nextAllowed = lastVoteTime[voter] + COOLDOWN;
        if (block.timestamp >= nextAllowed) return 0;
        return nextAllowed - block.timestamp;
    }

    function vote(uint256 candidateIndex) external {
        require(candidateIndex < candidates.length, "Candidat inexistant");
        require(
            block.timestamp >= lastVoteTime[msg.sender] + COOLDOWN,
            "Cooldown actif, attendez 3 minutes"
        );

        candidates[candidateIndex].voteCount += 1;
        lastVoteTime[msg.sender] = block.timestamp;

        emit Voted(msg.sender, candidateIndex);
    }
}
