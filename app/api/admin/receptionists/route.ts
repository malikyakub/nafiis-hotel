import { requireRole } from "@/lib/auth/require-role";
import { failure,json,sameOrigin } from "@/lib/http";
export async function GET(){try{
 const {supabase}=await requireRole("admin");
 const {data,error}=await supabase.from("profiles").select("id,full_name,phone,is_active").eq("role","receptionist").order("full_name");
 if(error)throw error;return json({receptionists:data});
}catch(error){return failure("receptionists.list",error)}}
export async function POST(request:Request){try{
 sameOrigin(request);const {supabase}=await requireRole("admin");const body=await request.json();
 if(!body||typeof body!=="object"||Array.isArray(body))return json({error:"Invalid receptionist form."},400);
 if(typeof body.email!=="string"||body.email.length>254||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)||typeof body.enabled!=="boolean")return json({error:"Enter a valid email and access state."},400);
 const {error}=await supabase.rpc("manage_receptionist",{p_email:body.email.trim().toLowerCase(),p_enabled:body.enabled});
 if(error){const safe=["Ask this person to register and verify their email first","Only three receptionist accounts are allowed","This account has another staff role"].find(m=>error.message.includes(m));return json({error:safe||"Receptionist access could not be updated."},400);}
 return json({saved:true});
}catch(error){return failure("receptionists.update",error)}}
