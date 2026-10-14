import "server-only";
import { Contract, FetchRequest, JsonRpcProvider, getAddress } from "ethers";
import { AccessError, requireRole } from "@/lib/auth/require-role";
import { PROOF_ABI } from "./abi";

export type Verification =
  | { status: "match"; stored: string; onChain: string }
  | { status: "mismatch"; stored: string; onChain: string }
  | { status: "missing"; stored: string; onChain: string }
  | { status: "configuration_required"; message: string };

const ZERO = `0x${"0".repeat(64)}`;

/**
 * Re-reads proofs(bookingKey) from the registry contract and compares it with the stored hash.
 * A read-only RPC call: no wallet, no transaction, no key beyond the public RPC URL.
 */
export async function verifyBookingProof(bookingId: string): Promise<Verification> {
  const { supabase } = await requireRole("admin");
  const rpc = process.env.AMOY_RPC_URL;
  if (!rpc) return { status: "configuration_required", message: "Set AMOY_RPC_URL on the server to verify proofs." };

  const { data: proof, error } = await supabase.from("booking_proofs")
    .select("booking_key,proof_hash,contract_address,chain_id")
    .eq("booking_id", bookingId).maybeSingle();
  if (error) throw new Error("Proof lookup failed.");
  if (!proof) throw new AccessError(404, "No proof is recorded for this booking.");

  const request = new FetchRequest(rpc);
  request.timeout = 10000;
  const provider = new JsonRpcProvider(request, undefined, { batchMaxCount: 1, cacheTimeout: -1 });
  try {
    if ((await provider.getNetwork()).chainId !== BigInt(proof.chain_id)) throw new Error("Wrong chain.");
    const contract = new Contract(getAddress(proof.contract_address), PROOF_ABI, provider);
    const onChain = String(await contract.proofs(proof.booking_key)).toLowerCase();
    const stored = String(proof.proof_hash).toLowerCase();
    if (onChain === ZERO) return { status: "missing", stored, onChain };
    return { status: onChain === stored ? "match" : "mismatch", stored, onChain };
  } finally {
    provider.destroy();
  }
}
