import { requireRole } from "@/lib/auth/require-role";
import { failure, json } from "@/lib/http";
import { expireUnpaidBookings } from "@/lib/bookings";
import { hotelToday } from "@/lib/format";

const STATUSES = ["pending_payment", "payment_submitted", "under_review", "confirmed", "checked_in", "checked_out", "cancelled", "completed"];

// Optional list filters (read-only):
//   view=arrivals    check-in today, not cancelled
//   view=departures  check-out today, confirmed or checked in
//   view=in_house    checked in
//   status=<booking status>, q=<reference fragment>
export async function GET(request: Request) {
  try {
    const { supabase } = await requireRole("admin", "receptionist");
    const params = new URL(request.url).searchParams;
    const page = Number(params.get("page") || 1);
    if (!Number.isSafeInteger(page) || page < 1 || page > 100000) return json({ error: "Invalid page." }, 400);
    const view = params.get("view") || "";
    const status = params.get("status") || "";
    const q = (params.get("q") || "").trim();
    if (view && !["arrivals", "departures", "in_house"].includes(view)) return json({ error: "Invalid view." }, 400);
    if (status && !STATUSES.includes(status)) return json({ error: "Invalid status." }, 400);
    if (q && !/^[A-Za-z0-9-]{1,30}$/.test(q)) return json({ error: "Search by booking reference." }, 400);
    await expireUnpaidBookings();
    const today = hotelToday();
    let query = supabase.from("bookings")
      .select("id,reference,created_at,payment_expires_at,cancellation_reason,check_in,check_out,status,total_amount,guests_count,rooms(room_number,room_types(name)),guests(booking_name,booking_phone,profiles(full_name,phone)),payment_submissions(id,status,review_note),booking_proofs(transaction_hash,status)", { count: "exact" });
    if (view === "arrivals") query = query.eq("check_in", today).neq("status", "cancelled");
    if (view === "departures") query = query.eq("check_out", today).in("status", ["confirmed", "checked_in"]);
    if (view === "in_house") query = query.eq("status", "checked_in");
    if (status) query = query.eq("status", status);
    if (q) query = query.ilike("reference", `%${q}%`);
    query = view ? query.order("check_in").order("id") : query.order("created_at", { ascending: false }).order("id");
    const { data, error, count } = await query.range((page - 1) * 50, page * 50 - 1);
    if (error) throw new Error("Staff booking lookup failed.");
    return json({ bookings: data, total: count || 0, page, pageSize: 50 });
  } catch (error) { return failure("staff.bookings", error); }
}
