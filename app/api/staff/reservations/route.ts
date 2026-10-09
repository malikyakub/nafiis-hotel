import {requireRole} from "@/lib/auth/require-role";
import {failure,json,sameOrigin} from "@/lib/http";
export async function POST(request:Request){try{
 sameOrigin(request);const {supabase}=await requireRole("admin","receptionist");const body=await request.json();
 if(!body||typeof body!=="object"||Array.isArray(body))return json({error:"Invalid reservation form."},400);
 const validDate=(s:unknown)=>typeof s==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
 if(typeof body.name!=="string"||body.name.trim().length<2||body.name.length>120||typeof body.phone!=="string"||body.phone.length>30||typeof body.email!=="string"||body.email.length>254||(body.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email))||typeof body.room_id!=="string"||!/^[0-9a-f-]{36}$/i.test(body.room_id)||!validDate(body.check_in)||!validDate(body.check_out)||!Number.isInteger(Number(body.guests))||Number(body.guests)<1||Number(body.guests)>20)return json({error:"Check guest details, room and dates."},400);
 const {data,error}=await supabase.rpc("front_desk_booking",{p_room:body.room_id,p_name:body.name,p_phone:body.phone,p_email:body.email,p_start:body.check_in,p_end:body.check_out,p_guests:Number(body.guests)});
 if(error)return json({error:"Booking could not be created. Check room availability, capacity and dates (maximum 60 nights)."},409);
 return json({reference:data},201);
}catch(error){return failure("staff.reservation",error)}}
