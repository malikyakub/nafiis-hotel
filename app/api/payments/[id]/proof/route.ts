import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { failure, json } from "@/lib/http";

export async function GET(_request:Request,context:{params:Promise<{id:string}>}) {
  try {
    const {supabase}=await requireRole("guest","admin","receptionist");
    const {id}=await context.params;
    const {data:payment,error}=await supabase.from("payment_submissions").select("object_path").eq("id",id).maybeSingle();
    if(error||!payment)return json({error:"Payment unavailable."},404);
    const {data,error:signError}=await createAdminClient().storage.from("payment-proofs").createSignedUrl(payment.object_path,60,{download:true});
    if(signError)throw new Error("Unable to retrieve attachment.");
    return json({url:data.signedUrl,expiresIn:60});
  }catch(error){return failure("payment.proof",error)}
}
