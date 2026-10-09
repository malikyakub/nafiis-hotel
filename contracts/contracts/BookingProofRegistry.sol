// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

/// @notice Booking attestations only. Does not accept payments or store guest data.
contract BookingProofRegistry {
    address public immutable registrar;
    mapping(bytes32 => bytes32) public proofs;
    event BookingAnchored(bytes32 indexed bookingKey, bytes32 proofHash);
    error Unauthorized();
    error InvalidProof();
    error ConflictingProof();

    constructor() { registrar = msg.sender; }

    function anchor(bytes32 bookingKey, bytes32 proofHash) external {
        if (msg.sender != registrar) revert Unauthorized();
        if (bookingKey == bytes32(0) || proofHash == bytes32(0)) revert InvalidProof();
        bytes32 previous = proofs[bookingKey];
        if (previous != bytes32(0) && previous != proofHash) revert ConflictingProof();
        if (previous == bytes32(0)) {
            proofs[bookingKey] = proofHash;
            emit BookingAnchored(bookingKey, proofHash);
        }
    }
}
