import { AccessError, requireRole } from "@/lib/auth/require-role";
import { failure, json, sameOrigin } from "@/lib/http";
import { MANAGEMENT, type ManagementField, type Resource } from "@/lib/management";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Context = {params:Promise<{resource:string}>};
async function resourceOf(context:Context) {
  const {resource}=await context.params;
  if(!Object.hasOwn(MANAGEMENT,resource))throw new AccessError(404,"Unknown management section.");
  return resource as Resource;
}
export async function GET(request:Request,context:Context){
 try {
  const resource=await resourceOf(context);
  const {supabase}=await requireRole("admin","receptionist");
  const page=Number(new URL(request.url).searchParams.get("page")||1);
  if(!Number.isSafeInteger(page)||page<1||page>100000)throw new AccessError(400,"Invalid page.");
  const selections:Record<Resource,string>={rooms:"*,room_types(name,capacity,base_price)",room_types:"*",food_menu:"*",food_orders:"*,bookings(reference)",guests:"*,profiles(full_name,phone)",hotel_settings:"*"};
  const result=await supabase.from(resource).select(selections[resource],{count:"exact"}).order(resource==="hotel_settings"?"id":"created_at",{ascending:false}).range((page-1)*50,page*50-1);
  if(result.error)throw result.error;
  return json({rows:result.data,total:result.count||0,page,pageSize:50});
 }catch(error){return failure("management.read",error)}
}
async function write(request:Request,context:Context,updating:boolean){
 try {
  sameOrigin(request);
  const resource=await resourceOf(context);
  const {supabase,profile}=await requireRole("admin","receptionist");
  const body=await request.json();
  if(!body || typeof body!=="object" || Array.isArray(body))throw new AccessError(400,"Invalid form.");
  if(profile.role!=="admin" && !(resource==="food_orders" || (resource==="rooms"&&updating)))throw new AccessError(403,"Administrator access required.");
  if(!updating&&["guests","hotel_settings"].includes(resource))throw new AccessError(400,"Use the existing record.");
  if(updating&&resource!=="hotel_settings"&&!uuid.test(body.id||""))throw new AccessError(400,"Invalid record.");
  const values:Record<string,unknown>={};
  let fields:ManagementField[]=MANAGEMENT[resource].fields;
  if(profile.role==="receptionist"&&resource==="rooms")fields=fields.filter(f=>f.name==="status");
  if(updating&&resource==="food_orders")fields=[{name:"status",label:"Status",type:"select",options:["preparing","ready","served","cancelled"],required:true}];
  for(const field of fields){
   const input=body[field.name];
   if(field.type==="checkbox"){if(typeof input!=="boolean")throw new AccessError(400,`Choose ${field.label}.`);values[field.name]=input;continue;}
   if((input===""||input===null||input===undefined)&&!field.required){values[field.name]=field.type==="number"||field.name==="booking_id"?null:"";continue;}
   if(field.type==="number"){
    const n=Number(input);if(input===""||input===null||!Number.isFinite(n)||n<(field.min??0)||n>(field.max??100000)||(["capacity","quantity","floor"].includes(field.name)&&!Number.isInteger(n)))throw new AccessError(400,`Check ${field.label}.`);values[field.name]=n;
   }else{
    if(typeof input!=="string"||input.length>1000||(field.required&&!input.trim()))throw new AccessError(400,`Check ${field.label}.`);
    if(field.options&&!field.options.includes(input))throw new AccessError(400,`Check ${field.label}.`);
    if((field.lookup||field.name==="booking_id")&&!uuid.test(input))throw new AccessError(400,`Check ${field.label}.`);
    if(field.type==="email"&&input&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input))throw new AccessError(400,"Enter a valid email.");
    if(["evc_number","edahab_number"].includes(field.name)&&input&&!/^\+?[0-9]{7,15}$/.test(input.trim()))throw new AccessError(400,"Enter a receiving number with 7–15 digits.");
    values[field.name]=input.trim();
   }
  }
  const operation=updating?supabase.from(resource).update(values).eq("id",resource==="hotel_settings"?1:body.id):supabase.from(resource).insert(values);
  const {data,error}=await operation.select("id").maybeSingle();
  if(error)throw new AccessError(400,resource==="food_orders"?"Order could not be saved. Check availability, booking status and the order transition.":"Record could not be saved. Check for duplicate names/numbers and valid values.");
  if(!data)throw new AccessError(404,"Record unavailable.");
  return json({saved:true});
 }catch(error){return failure("management.write",error)}
}
export const POST=(request:Request,context:Context)=>write(request,context,false);
export const PATCH=(request:Request,context:Context)=>write(request,context,true);
