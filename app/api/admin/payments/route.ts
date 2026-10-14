import { requireRole } from "@/lib/auth/require-role";
import { failure, json } from "@/lib/http";

// Optional filter: status=submitted (review queue) or status=reviewed (approved or rejected).
export async function GET(request: Request) {
  try {
    const { supabase } = await requireRole("admin","receptionist");
    const params=new URL(request.url).searchParams;
    const page=Number(params.get("page")||1);
    if(!Number.isSafeInteger(page)||page<1||page>100000)return json({error:"Invalid page."},400);
    const status=params.get("status")||"";
    if(status&&!["submitted","reviewed"].includes(status))return json({error:"Invalid status."},400);
    let query=supabase.from("payment_submissions")
      .select("id,booking_id,amount,status,transfer_reference,created_at,reviewed_at,review_note,bookings(reference,status,check_in,check_out,rooms(room_number,room_types(name)),guests(booking_name,booking_phone,profiles(full_name,phone)),booking_proofs(transaction_hash,status))",{count:"exact"});
    if(status==="submitted")query=query.eq("status","submitted");
    if(status==="reviewed")query=query.in("status",["approved","rejected"]);
    const {data,error,count}=await query.order("created_at",{ascending:false}).order("id").range((page-1)*50,page*50-1);
    if(error)throw new Error("Payment queue lookup failed.");
    return json({payments:data,total:count||0,page,pageSize:50});
  }catch(error){return failure("payments.list",error)}
}
