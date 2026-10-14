import { hasGuestCheckout } from "@/lib/guest-checkout";
import { createAdminClient } from "@/lib/supabase/admin";
import { failure, json } from "@/lib/http";

export async function GET(_request: Request, context: {params:Promise<{id:string}>}) {
  try {
    const {id}=await context.params;
    if (!await hasGuestCheckout(id)) return json({error:"Open this booking in the same browser you used to book. Guest access lasts seven days."},403);
    const db=createAdminClient();
    const {data:booking,error}=await db.from("bookings").select("id,reference,status,hold_expires_at,check_in,check_out,total_amount,rooms(room_number,room_types(name)),payment_submissions(status,review_note),booking_proofs(status,transaction_hash)").eq("id",id).maybeSingle();
    if(error) throw new Error("Checkout lookup failed.");
    if(!booking) return json({error:"Booking unavailable."},404);
    const {data:settings,error:settingsError}=await db.from("hotel_settings").select("payment_instructions,evc_number,evc_name,edahab_number,edahab_name").eq("id",1).single();
    if(settingsError) throw new Error("Payment instructions unavailable.");
    return json({booking,settings,serverTime:Date.now()});
  }catch(error){return failure("checkout.read",error)}
}
