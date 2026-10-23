"use client";
import { MAX_RECEIPT_BYTES } from "@/lib/upload-limits";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { roomTakenHref } from "@/lib/room-taken";
import { FileText, Mail, Phone, Upload, RefreshCw } from "lucide-react";
import { formatDate } from "@/lib/format";
import { Card } from "./card";
import { Button, ButtonLink } from "./button";
import { Alert } from "./alert";
import { Field } from "./field";
import { StatusBadge } from "./badge";
import { useAlert } from "./alert-provider";
import { clearPendingContact, readPendingContact, rememberDetails, type SavedContact } from "./saved-contact";
type Related<T> = T | T[] | null;
const one=<T,>(v:Related<T>|undefined):T|undefined=>Array.isArray(v)?v[0]:v??undefined;
type Checkout = {
 serverTime:number;
 code:"expired"|"room_taken"|null;
 booking:{payment_expires_at:string;cancellation_reason:string|null;reference:string;status:string;check_in:string;check_out:string;total_amount:number;
 rooms:Related<{room_number:string;room_types:Related<{name:string}>}>;
 payment_submissions:Related<{status:string;review_note:string|null}>;
 booking_proofs:Related<{status:string;transaction_hash:string}>};
 settings:{phone:string|null;email:string|null;payment_instructions:string|null;evc_number:string;evc_name:string;edahab_number:string;edahab_name:string};
};
export function GuestPayment({id}:{id:string}) {
 const router=useRouter();
 const showAlert=useAlert();
 // Details just booked with in this tab, for the optional "save on this device" offer.
 const [pending,setPending]=useState<SavedContact|null>(null);
 const [clock,setClock]=useState({now:0,offset:0});
 useEffect(()=>{const timer=setInterval(()=>setClock(c=>({...c,now:Date.now()+c.offset})),1000);return()=>clearInterval(timer)},[]);
 const [data,setData]=useState<Checkout|null>(null);
 const [error,setError]=useState("");const [notice,setNotice]=useState("");
 const [version,setVersion]=useState(0);const [busy,setBusy]=useState(false);
 useEffect(()=>{
  const controller=new AbortController();
  async function load(){try{
   const response=await fetch(`/api/checkout/${encodeURIComponent(id)}`,{cache:"no-store",signal:controller.signal});
   const body=await response.json();if(!response.ok)throw new Error(body.error||"Unable to load booking.");
   if(body.code==="room_taken"){router.replace(roomTakenHref(body.booking));return;}
   setClock({now:body.serverTime,offset:body.serverTime-Date.now()});setData(body);setPending(readPendingContact(id));setError("");if(body.booking.status!=="payment_submitted")setNotice("");
  }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Unable to load booking.");}}
  void load();const timer=setInterval(()=>{void load();},15000);
  return()=>{controller.abort();clearInterval(timer)};
 },[id,version,router]);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setError("");setNotice("");
  try {
   const body=new FormData(event.currentTarget);const file=body.get("proof");
   if(!(file instanceof File)||!file.size||file.size>MAX_RECEIPT_BYTES)throw new Error("Choose a screenshot or PDF under 4 MB.");
   const response=await fetch(`/api/bookings/${encodeURIComponent(id)}/payment`,{method:"POST",body});
   const result=await response.json();
   if(result.code==="room_taken"){router.replace(roomTakenHref(result));return;}
   if(result.code==="expired"){setError(result.error);setVersion(v=>v+1);return;}
   if(!response.ok)throw new Error(result.error||"Upload failed.");
   setNotice("Screenshot submitted. Your room is now reserved while the hotel administrator verifies your payment.");setVersion(v=>v+1);
  }catch(e){setError(e instanceof Error?e.message:"Upload failed.");}finally{setBusy(false);}
 }
 const b=data?.booking;const settings=data?.settings;const payment=one(b?.payment_submissions);const proof=one(b?.booking_proofs);
 const remaining=b?Math.max(0,Math.ceil((Date.parse(b.payment_expires_at)-clock.now)/1000)):0;
 const expired=data?.code==="expired"||(b?.status==="pending_payment"&&remaining<=0);
 return <div className="mx-auto max-w-3xl space-y-6">
  <div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">Step 3 of 3</p><h1 className="font-display text-4xl">Payment & confirmation</h1></div>
  <p className="text-muted">Pay with EVC Plus or eDahab, upload your screenshot, then follow your confirmation here. No account is needed.</p>
  {error&&<Alert status="danger">{error}</Alert>}{notice&&<Alert status="success">{notice}</Alert>}
  {!b&&!error&&<p role="status">Loading your booking…</p>}
  {b&&settings&&<>
   <Card><div className="flex flex-wrap justify-between gap-3"><h2 className="font-display text-2xl">{b.reference}</h2><StatusBadge value={b.status}/></div>
    <p className="mt-3">{one(b.rooms)?.room_number} · {one(one(b.rooms)?.room_types)?.name}</p><p>{formatDate(b.check_in)} – {formatDate(b.check_out)}</p>
    <p className="mt-3 text-xl font-semibold">Total: USD ${Number(b.total_amount).toFixed(2)}</p>
   </Card>
   {expired&&<Alert status="warning">Payment was not received within 24 hours, so this booking was cancelled. Do not send money for it. <Link className="underline" href="/#book">Book again</Link>. If you already sent money, keep the receipt and ask the hotel to resolve it before paying again.</Alert>}
   {b.status==="pending_payment"&&!expired&&<>
    <Alert status="warning">This room is not reserved until you submit your payment screenshot. If another guest submits a payment for it first, you will be asked to choose another room. Unpaid bookings are cancelled after 24 hours ({Math.floor(remaining/3600)}h {String(Math.floor(remaining%3600/60)).padStart(2,"0")}m left).</Alert>
    <Card><h2 className="font-display text-2xl">Choose how to pay</h2>
     <p className="mt-2 text-muted">Use your mobile-money app or service to send the exact total to one of the hotel accounts below. Check the receiving name before confirming. This website will never ask for your PIN.</p>
     <div className="mt-4 grid gap-4 sm:grid-cols-2">{[{name:"EVC Plus",number:settings.evc_number,holder:settings.evc_name},{name:"eDahab",number:settings.edahab_number,holder:settings.edahab_name}].map(method=><div key={method.name} className="rounded-2xl border border-border p-4"><h3 className="font-semibold">{method.name}</h3>{method.number?<><p className="mt-2 text-xl">{method.number}</p>{method.holder&&<p>{method.holder}</p>}</>:<p className="mt-2 text-sm text-muted">The hotel has not configured this payment account yet. Do not send payment until the receiving details appear.</p>}</div>)}</div>
     {settings.payment_instructions&&<p className="mt-4 whitespace-pre-wrap text-sm">{settings.payment_instructions}</p>}
     <p className="mt-3 text-sm">Keep the receipt or transaction number shown by your mobile-money service.</p>
    </Card>
    <Card><h2 className="font-display text-2xl">Upload your payment screenshot</h2>
     <form className="mt-4 space-y-4" onSubmit={submit}>
      <Field name="proof" label="Screenshot or receipt" type="file" icon={Upload} accept="image/png,image/jpeg,application/pdf" required hint="PNG, JPEG or PDF, up to 4 MB."/>
      <Field name="reference" label="Receipt / transaction number" icon={FileText} maxLength={120} required hint="Enter the number shown on your payment receipt."/>
      <Button type="submit" disabled={busy}>{busy?"Uploading…":"Submit payment screenshot"}</Button>
     </form>
    </Card>
   </>}
   <Card><h2 className="font-display text-2xl">Your confirmation status</h2>
    <p className="mt-3">{b.status==="payment_submitted"?"Your screenshot is awaiting review by the hotel administrator. Your room is reserved during review.":b.status==="under_review"?"Your payment has been approved. Your booking is awaiting its blockchain proof.":["confirmed","checked_in","checked_out","completed"].includes(b.status)?"Your booking is confirmed.":b.status==="cancelled"?`This booking has been cancelled.${b.cancellation_reason?` Reason: ${b.cancellation_reason}.`:""}`:"After you upload your screenshot, the hotel administrator checks the payment. Once approved, the system records the booking proof on blockchain."}</p>
    {payment?.review_note&&<p className="mt-3">Hotel note: {payment.review_note}</p>}
    {proof&&/^0x[0-9a-f]{64}$/i.test(proof.transaction_hash)&&<p className="mt-3"><a className="underline" href={`https://amoy.polygonscan.com/tx/${proof.transaction_hash}`} target="_blank" rel="noopener noreferrer">View booking proof · {proof.status} · Amoy testnet</a></p>}
    <Button className="mt-4" variant="secondary" onClick={()=>setVersion(v=>v+1)}><RefreshCw/>Refresh status</Button>
   </Card>
   {pending&&<Card className="flex flex-col gap-3"><h2 className="font-display text-2xl">Save your details for next time</h2>
    <p className="text-sm text-muted">Optional: remember your name, phone and email on this device. Avoid this on shared computers.</p>
    <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={()=>{rememberDetails(showAlert,pending);clearPendingContact();setPending(null);}}>Save details on this device</Button><Button variant="ghost" onClick={()=>{clearPendingContact();setPending(null);}}>No thanks</Button></div>
   </Card>}
   {(settings.phone||settings.email)&&<Card className="flex flex-col gap-3"><h2 className="font-display text-2xl">Questions about your booking?</h2>
    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">{settings.phone&&<a className="inline-flex items-center gap-2 text-brand hover:underline" href={`tel:${settings.phone.replace(/[^\d+]/g,"")}`}><Phone aria-hidden className="size-4"/>{settings.phone}</a>}{settings.email&&<a className="inline-flex items-center gap-2 text-brand hover:underline" href={`mailto:${settings.email}`}><Mail aria-hidden className="size-4"/>{settings.email}</a>}</div>
   </Card>}
   <p className="text-sm text-muted">Keep this page bookmarked in this browser. Private guest access lasts seven days. Creating an account with the same verified booking email lets you keep your booking history.</p>
   <ButtonLink variant="secondary" href="/register">Create an account (optional)</ButtonLink>
  </>}
 </div>;
}
