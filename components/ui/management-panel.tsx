"use client";
import { useEffect,useState,type FormEvent } from "react";
import { FileText,Mail } from "lucide-react";
import { MANAGEMENT,type Resource,type ManagementField } from "@/lib/management";
import { Button } from "./button";
import { Field } from "./field";
import { Card } from "./card";
import { Alert } from "./alert";
import { StatusBadge } from "./badge";
import { FrontDeskBooking } from "./front-desk-booking";

type Row=Record<string,unknown> & {id:string};
type Page={rows:Row[];total:number;pageSize:number};
async function api<T>(url:string,options?:RequestInit):Promise<T>{const response=await fetch(url,{cache:"no-store",...options});const data=await response.json();if(!response.ok)throw new Error(data.error||"Request failed.");return data;}
function relation(value:unknown):Record<string,unknown>{return (Array.isArray(value)?value[0]:value) as Record<string,unknown>||{};}
function show(value:unknown){return value===null||value===undefined||value===""?"—":typeof value==="boolean"?(value?"Yes":"No"):String(value);}

export function ManagementPanel({role}:{role:"admin"|"receptionist"}){
 const [section,setSection]=useState<Resource|"staff"|"availability"|"reports">("availability");
 const [page,setPage]=useState(1);const [revision,setRevision]=useState(0);
 const [data,setData]=useState<Page|null>(null);const [staff,setStaff]=useState<Row[]>([]);
 const [editing,setEditing]=useState<Row|null>(null);const [adding,setAdding]=useState(false);
 const [options,setOptions]=useState<Record<string,Row[]>>({});
 const [error,setError]=useState("");const [notice,setNotice]=useState("");const [busy,setBusy]=useState(false);const [loading,setLoading]=useState(false);
 const [available,setAvailable]=useState<Record<string,unknown>[]|null>(null);
 const [report,setReport]=useState<Record<string,unknown>|null>(null);
 useEffect(()=>{
  let live=true;setData(null);setError("");setLoading(true);
  const load=async()=>{
   if(section==="staff"){const result=await api<{receptionists:Row[]}>("/api/admin/receptionists");if(live)setStaff(result.receptionists);}
   else if(section!=="availability"&&section!=="reports"){
    const result=await api<Page>(`/api/management/${section}?page=${page}`);if(live)setData(result);
   }
  };load().catch(e=>{if(live)setError(e.message)}).finally(()=>{if(live)setLoading(false)});
  return()=>{live=false};
 },[section,page,revision]);
 const fields:ManagementField[]=section in MANAGEMENT?MANAGEMENT[section as Resource].fields:[];
 async function openEditor(row:Row|null){
  setError("");setBusy(true);
  try{
   const next:Record<string,Row[]>={};
   for(const field of fields){if(field.lookup&&!next[field.lookup]){
    let p=1;let result:Page;const rows:Row[]=[];
    do{result=await api<Page>(`/api/management/${field.lookup}?page=${p++}`);rows.push(...result.rows);}while(rows.length<result.total);
    next[field.lookup]=rows;
   }}
   setOptions(next);setEditing(row);setAdding(!row);
  }catch(e){setError(e instanceof Error?e.message:"Unable to open form.")}finally{setBusy(false)}
 }
 async function save(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setError("");setNotice("");
  const form=new FormData(event.currentTarget);const body:Record<string,unknown>={id:editing?.id};
  for(const field of fields)body[field.name]=field.type==="checkbox"?form.has(field.name):String(form.get(field.name)||"");
  try{await api(`/api/management/${section}`,{method:editing?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});setEditing(null);setAdding(false);setNotice("Saved.");setRevision(v=>v+1);}
  catch(e){setError(e instanceof Error?e.message:"Save failed.")}finally{setBusy(false)}
 }
 async function updateStatus(id:string,status:string){
  setBusy(true);setError("");try{await api(`/api/management/${section}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,status})});setRevision(v=>v+1)}catch(e){setError(e instanceof Error?e.message:"Update failed.")}finally{setBusy(false)}
 }
 async function staffAccess(event:FormEvent<HTMLFormElement>){
  event.preventDefault();const form=new FormData(event.currentTarget,(event.nativeEvent as SubmitEvent).submitter);setBusy(true);setError("");setNotice("");
  try{await api("/api/admin/receptionists",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:form.get("email"),enabled:form.get("access")==="add"})});setNotice("Receptionist access updated. Ask them to sign in again.");setRevision(v=>v+1)}catch(e){setError(e instanceof Error?e.message:"Update failed.")}finally{setBusy(false)}
 }
 async function dates(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setError("");setAvailable(null);setReport(null);const form=new FormData(event.currentTarget);const query=new URLSearchParams({check_in:String(form.get("check_in")),check_out:String(form.get("check_out"))});
  try{if(section==="availability"){const result=await api<{rooms:Record<string,unknown>[]}>(`/api/availability?${query}`);setAvailable(result.rooms)}else setReport(await api(`/api/admin/reports?${query}`));}catch(e){setError(e instanceof Error?e.message:"Lookup failed.")}finally{setBusy(false)}
 }
 const sections:string[][]=[["availability","Availability"],["rooms","Rooms"],["room_types","Room types & prices"],["food_menu","Food menu"],["food_orders","Food orders"],["guests","Customers"],...(role==="admin"?[["staff","Receptionists"],["reports","Reports"],["hotel_settings","Hotel settings"]]:[])];
 return <section className="space-y-5">
  <h2 className="font-display text-3xl">Hotel management</h2>
  <nav className="flex flex-wrap gap-2" aria-label="Hotel management">{sections.map(([key,label])=><Button key={key} variant={section===key?"primary":"secondary"} disabled={busy} onClick={()=>{setSection(key as typeof section);setPage(1);setEditing(null);setAdding(false);setNotice("");setAvailable(null);setReport(null)}}>{label}</Button>)}</nav>
  {error&&<Alert status="danger">{error}</Alert>}{notice&&<Alert status="success">{notice}</Alert>}{loading&&<p role="status">Loading…</p>}
  {(section==="availability"||section==="reports")&&<Card><h3 className="font-display text-xl">{section==="availability"?"Find available rooms":"Booking and payment report"}</h3><form onSubmit={dates} className="mt-4 flex flex-wrap items-end gap-4"><Field name="check_in" label="From" type="date" icon={FileText} required/><Field name="check_out" label="To (exclusive)" type="date" icon={FileText} required/><Button type="submit" disabled={busy}>View results</Button></form>{available&&<div className="mt-4 space-y-3">{available.length===0?<p>No rooms available for these dates.</p>:available.map(room=><p key={String(room.room_id)}>{show(room.room_number)} · {show(room.room_type)} · {show(room.capacity)} guests · USD {show(room.nightly_rate)}/night</p>)}</div>}{report&&<dl className="mt-5 grid gap-4 sm:grid-cols-2">{Object.entries(report).map(([key,value])=><div key={key}><dt className="text-sm capitalize text-muted">{key.replaceAll("_"," ")}</dt><dd className="text-xl">{show(value)}</dd></div>)}</dl>}</Card>}
  {section==="staff"&&<Card><h3 className="font-display text-xl">Receptionists ({staff.length}/3)</h3><p className="mt-2 text-sm text-muted">Ask each person to register and verify their email first. Add their email here to give reception access. Remove access by entering the same email below.</p><ul className="my-4 space-y-2">{staff.map(person=><li key={person.id}>{show(person.full_name)} · {show(person.phone)} · {person.is_active?"Active":"Disabled"}</li>)}</ul><form onSubmit={staffAccess} className="max-w-lg space-y-4"><Field name="email" label="Receptionist email" type="email" icon={Mail} required/><div className="flex flex-wrap gap-2"><Button type="submit" name="access" value="add" disabled={busy||staff.length>=3}>Add receptionist</Button><Button type="submit" name="access" value="remove" variant="secondary" disabled={busy}>Remove receptionist access</Button></div></form></Card>}
  {data&&<>
   <div className="flex flex-wrap gap-2"><Button variant="secondary" disabled={busy||loading} onClick={()=>setRevision(v=>v+1)}>Refresh</Button>{!["guests","hotel_settings"].includes(section)&&(role==="admin"||section==="food_orders")&&<Button disabled={busy} onClick={()=>openEditor(null)}>Add {section==="food_orders"?"food order":"record"}</Button>}</div>
   {(editing||adding)&&<Card><form onSubmit={save} className="grid gap-4 md:grid-cols-2">
    {fields.map(field=>field.type==="checkbox"?<label key={field.name} className="flex items-center gap-2"><input type="checkbox" name={field.name} defaultChecked={editing?Boolean(editing[field.name]):true}/>{field.label}</label>:field.type==="select"?<label className="flex flex-col gap-2 text-sm" key={field.name}>{field.label}<select className="h-11 rounded-full border border-border-strong bg-surface px-4" name={field.name} defaultValue={String(editing?.[field.name]||"")} required={field.required}><option value="">Choose…</option>{field.options?.map(value=><option key={value} value={value}>{value}</option>)}{field.lookup&&options[field.lookup]?.map(row=><option key={row.id} value={row.id}>{show(row.name)}</option>)}</select></label>:<Field key={field.name} name={field.name} label={field.label} type={field.type||"text"} icon={FileText} defaultValue={String(editing?.[field.name]??"")} required={field.required} min={field.min} max={field.max} maxLength={1000} step={field.type==="number"?(["floor","capacity","quantity"].includes(field.name)?1:"0.01"):undefined}/>)}
    <div className="flex gap-2 md:col-span-2"><Button type="submit" disabled={busy}>Save</Button><Button variant="secondary" disabled={busy} onClick={()=>{setEditing(null);setAdding(false)}}>Cancel</Button></div>
   </form></Card>}
   {data.rows.length===0&&<Card>No records yet.</Card>}
   <div className="grid gap-4 lg:grid-cols-2">{data.rows.map(row=><Card key={row.id}>
    <h3 className="font-display text-xl">{show(row.room_number||row.name||row.item_name||relation(row.profiles).full_name||row.booking_name|| (section==="hotel_settings"?"Hotel settings":"Customer"))}</h3>
    {row.status? <div className="mt-2"><StatusBadge value={String(row.status)}/></div>:null}
    <dl className="my-4 grid grid-cols-2 gap-3 text-sm">{(section==="food_orders"?["quantity","unit_price","notes","created_at"]:fields.map(f=>f.name).filter(n=>!["room_type_id"].includes(n))).map(name=><div key={name}><dt className="capitalize text-muted">{name.replaceAll("_"," ")}</dt><dd className="break-words">{show(row[name])}</dd></div>)}</dl>
    {section==="rooms"&&<p className="mb-3 text-sm">{show(relation(row.room_types).name)} · Base rate USD {show(relation(row.room_types).base_price)}<br/>Use Availability for date-specific occupancy.</p>}
    {section==="food_orders"&&<p className="mb-3 text-sm">Booking: {show(relation(row.bookings).reference)} · Total USD {(Number(row.quantity)*Number(row.unit_price)).toFixed(2)}</p>}
    {section==="food_orders"?<div className="flex flex-wrap gap-2">{(row.status==="pending"?["preparing","cancelled"]:row.status==="preparing"?["ready","cancelled"]:row.status==="ready"?["served"]:[]).map(status=><Button key={status} disabled={busy} variant="secondary" onClick={()=>updateStatus(row.id,status)}>{status}</Button>)}</div>:role==="admin"?<Button variant="secondary" disabled={busy} onClick={()=>openEditor(row)}>Edit</Button>:section==="rooms"?<div className="flex flex-wrap gap-2">{["available","cleaning","maintenance"].map(status=><Button key={status} variant="secondary" disabled={busy||row.status===status} onClick={()=>updateStatus(row.id,status)}>{status}</Button>)}</div>:null}
   </Card>)}</div>
   <div className="flex items-center gap-3"><Button variant="secondary" disabled={page===1||loading||busy} onClick={()=>setPage(p=>p-1)}>Previous</Button><span>{page} / {Math.max(1,Math.ceil(data.total/50))} · {data.total} records</span><Button variant="secondary" disabled={page*50>=data.total||loading||busy} onClick={()=>setPage(p=>p+1)}>Next</Button></div>
  </>}
  {(section === "availability" || section === "rooms") && <FrontDeskBooking />}
 </section>;
}
