import { requireRole } from "@/lib/auth/require-role";
import { failure, json } from "@/lib/http";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { supabase } = await requireRole("guest");
    const { id } = await context.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "Invalid booking ID." }, 400);
    const { data, error } = await supabase.from("bookings")
      .select("id,reference,check_in,check_out,arrival_time,departure_time,guests_count,nightly_rate,total_amount,status,cancellation_reason,created_at,rooms(room_number,room_types(name)),payment_submissions(id,status,amount,reviewed_at,review_note),booking_proofs(transaction_hash,status,chain_id,contract_address,proof_hash,booking_key,block_number,confirmed_at)")
      .eq("id", id).maybeSingle();
    if (error) throw new Error("Booking lookup failed.");
    return data ? json({ booking: data }) : json({ error: "Booking unavailable." }, 404);
  } catch (error) { return failure("booking.detail", error); }
}
