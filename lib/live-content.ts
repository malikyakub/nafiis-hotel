import "server-only";
import {connection} from "next/server";
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
