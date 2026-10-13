import { requireRole } from "@/lib/auth/require-role";
import { failure, json, sameOrigin } from "@/lib/http";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    sameOrigin(request);
    const { supabase } = await requireRole("admin", "receptionist");
    const { id } = await context.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "Invalid booking ID." }, 400);
    const body = await request.json();
    if(!body||typeof body!=="object"||Array.isArray(body))return json({error:"Invalid booking update."},400);
    if(body.status === "cancelled") {
      if(typeof body.reason!=="string"||!body.reason.trim()||body.reason.length>1000)return json({error:"Enter a cancellation reason."},400);
      const {data,error}=await supabase.from("bookings").update({status:"cancelled",cancellation_reason:body.reason.trim()}).eq("id",id).eq("status","pending_payment").select("id,reference,status").maybeSingle();
      if(error)throw error;
      if(!data)return json({error:"Only unpaid bookings can be cancelled here. Payments require administrator review."},409);
      return json({booking:data});
    }
    const from = body.status === "checked_in" ? "confirmed" : body.status === "checked_out" ? "checked_in" : null;
    if (!from) return json({ error: "Only check-in and check-out are supported here." }, 400);
    const { data, error } = await supabase.from("bookings").update({ status: body.status })
      .eq("id", id).eq("status", from).select("id,reference,status").maybeSingle();
    if (error) throw new Error("Booking update failed.");
    if (!data) return json({ error: "Booking unavailable or its status has changed. Refresh before retrying." }, 409);
    return json({ booking: data });
  } catch (error) { return failure("staff.booking.update", error); }
}
