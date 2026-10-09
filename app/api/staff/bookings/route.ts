import { requireRole } from "@/lib/auth/require-role";
import { failure, json } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const { supabase } = await requireRole("admin", "receptionist");
    const page = Number(new URL(request.url).searchParams.get("page") || 1);
    if (!Number.isSafeInteger(page) || page < 1 || page > 100000) return json({ error: "Invalid page." }, 400);
    const { data, error, count } = await supabase.from("bookings")
      .select("id,reference,hold_expires_at,check_in,check_out,status,total_amount,guests_count,rooms(room_number),guests(booking_name,booking_phone,profiles(full_name,phone)),payment_submissions(id,status,review_note),booking_proofs(transaction_hash,status)", { count: "exact" })
      .order("check_in").order("id").range((page - 1) * 50, page * 50 - 1);
    if (error) throw new Error("Staff booking lookup failed.");
    return json({ bookings: data, total: count || 0, page, pageSize: 50 });
  } catch (error) { return failure("staff.bookings", error); }
}
