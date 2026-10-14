import "server-only";
import {cache} from "react";
import {connection} from "next/server";
import {brand} from "./brand";
import {createAdminClient} from "./supabase/admin";
import {ROOMS,MENU,usd} from "./content";
import {createServerClient} from "./supabase/server";
import {logError} from "./log";

export async function liveRooms(){
 await connection();
 try{
  const supabase=await createServerClient();const {data,error}=await supabase.from("room_types").select("name,booking_code,base_price,capacity,is_active");if(error)throw error;
  return ROOMS.flatMap(room=>{const type=data.find(t=>t.booking_code===room.bookingType);if(!type?.is_active)return [];return [{...room,name:type.name,price:Number(type.base_price),facts:room.facts.map(f=>f.text.startsWith("Up to ")?{...f,text:`Up to ${type.capacity} guests`}:f)}]});
 }catch(error){logError("public.rooms",error);return ROOMS;}
}
export async function liveMenu(){
 await connection();
 try{
  const supabase=await createServerClient();const {data,error}=await supabase.from("food_menu").select("name,category,description,price").eq("is_available",true).order("created_at").order("name");if(error)throw error;
  const categories=[...new Set([...MENU.map(m=>m.label),...data.map(m=>m.category)])];
  return categories.map((category,index)=>({id:`menu-${index}`,label:category,hours:MENU.find(m=>m.label===category)?.hours||"Ask reception",items:data.filter(m=>m.category===category).map(m=>({name:m.name,text:m.description,price:usd(Number(m.price))}))}));
 }catch(error){logError("public.menu",error);return MENU;}
}

export type HotelContact = { phone: string; phoneHref: string; email: string; address: string };

// Public contact details, edited by the administrator in Settings. Falls back to lib/brand.ts
// until the settings row has them. Only public fields are read; cached once per request.
export const liveContact = cache(async (): Promise<HotelContact> => {
  const fallback = brand.contact;
  const result: HotelContact = {
    phone: fallback.phone,
    phoneHref: fallback.phoneHref,
    email: fallback.email,
    address: `${fallback.street}, ${fallback.district}, ${brand.city}`,
  };
  try {
    const { data, error } = await createAdminClient().from("hotel_settings").select("phone,email,address").eq("id", 1).maybeSingle();
    if (error) throw error;
    if (data?.phone?.trim()) { result.phone = data.phone.trim(); result.phoneHref = data.phone.replace(/[^\d+]/g, ""); }
    if (data?.email?.trim()) result.email = data.email.trim();
    if (data?.address?.trim()) result.address = data.address.trim();
  } catch (error) { logError("public.contact", error); }
  return result;
});
