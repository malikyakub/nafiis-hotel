import "server-only";

export const PROOF_ABI = [
  "function registrar() view returns (address)",
  "function proofs(bytes32) view returns (bytes32)",
  "function anchor(bytes32 bookingKey, bytes32 proofHash)",
  "event BookingAnchored(bytes32 indexed bookingKey, bytes32 proofHash)",
] as const;
