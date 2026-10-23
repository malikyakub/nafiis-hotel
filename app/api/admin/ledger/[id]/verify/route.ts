import { verifyBookingProof } from "@/lib/chain/verify-proof";
import { failure, json } from "@/lib/http";

// Read-only: compares a booking's stored proof hash with the contract's proofs(bookingKey).
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "Invalid booking ID." }, 400);
    return json(await verifyBookingProof(id));
  } catch (error) { return failure("ledger.verify", error); }
}
