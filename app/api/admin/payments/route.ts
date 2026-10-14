import { requireRole } from "@/lib/auth/require-role";
import { failure, json } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const { supabase } = await requireRole("admin","receptionist");
    const page=Number(new URL(request.url).searchParams.get("page")||1);
    if(!Number.isSafeInteger(page)||page<1||page>100000)return json({error:"Invalid page."},400);
    const {data,error,count}=await supabase.from("payment_submissions")
      .select("id,booking_id,amount,status,transfer_reference,created_at,reviewed_at,review_note,bookings(reference,status,booking_proofs(transaction_hash,status))",{count:"exact"})
      .order("created_at",{ascending:false}).order("id").range((page-1)*50,page*50-1);
    if(error)throw new Error("Payment queue lookup failed.");
    return json({payments:data,total:count||0,page,pageSize:50});
  }catch(error){return failure("payments.list",error)}
}
