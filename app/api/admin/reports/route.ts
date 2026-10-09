import {requireRole} from "@/lib/auth/require-role";
import {failure,json} from "@/lib/http";
export async function GET(request:Request){try{
 const {supabase}=await requireRole("admin");const params=new URL(request.url).searchParams;
 const start=params.get("check_in")||"",end=params.get("check_out")||"";
 if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!/^\d{4}-\d{2}-\d{2}$/.test(end)||!Number.isFinite(Date.parse(start))||!Number.isFinite(Date.parse(end))||end<=start)return json({error:"Choose a valid date range."},400);
 const {data,error}=await supabase.rpc("hotel_management_report",{p_start:start,p_end:end});
 if(error)throw error;return json(data);
}catch(error){return failure("management.report",error)}}
