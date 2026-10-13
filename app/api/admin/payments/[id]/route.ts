import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { failure, json, sameOrigin } from "@/lib/http";
import { anchorBooking } from "@/lib/chain/booking-proof";

export async function PATCH(request: Request, context:{params:Promise<{id:string}>}) {
  try {
    sameOrigin(request);
    const {user,supabase}=await requireRole("admin");
    const {id}=await context.params;
    const body=await request.json();
    if(!body||typeof body!=="object"||Array.isArray(body))return json({error:"Invalid review."},400);
    if(!/^[0-9a-f-]{36}$/i.test(id)||!["approved","rejected"].includes(body.decision)||typeof body.note!=="string"||body.note.length>1000)return json({error:"Invalid review."},400);
    if(body.decision==="rejected"&&!body.note.trim())return json({error:"A rejection reason is required."},400);
    const {error}=await createAdminClient().rpc("review_booking_payment",{p_payment:id,p_admin:user.id,p_decision:body.decision,p_note:body.note.trim()});
    if(error)return json({error:"Review could not be saved. Refresh the payment before retrying."},409);
    if(body.decision==="approved") {
      const {data:payment}=await supabase.from("payment_submissions").select("booking_id").eq("id",id).single();
      if(payment) return json(await anchorBooking(payment.booking_id));
    }
    return json({status:body.decision,message:body.decision==="approved"?"Payment approved. Check blockchain proof from the booking.":"Payment rejected and booking cancelled."});
  }catch(error){return failure("payment.review",error)}
}
