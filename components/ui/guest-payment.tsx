"use client";
import { MAX_RECEIPT_BYTES } from "@/lib/upload-limits";
import { useEffect, useState, type FormEvent } from "react";
import { FileText, Upload, RefreshCw } from "lucide-react";
import { Card } from "./card";
import { Button, ButtonLink } from "./button";
import { Alert } from "./alert";
import { Field } from "./field";
import { StatusBadge } from "./badge";
import { BookingSteps } from "./booking-steps";
type Related<T> = T | T[] | null;
const one=<T,>(v:Related<T>|undefined):T|undefined=>Array.isArray(v)?v[0]:v??undefined;
type Checkout = {
 serverTime:number;
 booking:{hold_expires_at:string;reference:string;status:string;check_in:string;check_out:string;total_amount:number;
 rooms:Related<{room_number:string;room_types:Related<{name:string}>}>;
 payment_submissions:Related<{status:string;review_note:string|null}>;
 booking_proofs:Related<{status:string;transaction_hash:string}>};
 settings:{payment_instructions:string|null;evc_number:string;evc_name:string;edahab_number:string;edahab_name:string};
};
export function GuestPayment({id}:{id:string}) {
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
   setClock({now:body.serverTime,offset:body.serverTime-Date.now()});setData(body);setError("");if(body.booking.status!=="payment_submitted")setNotice("");
  }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Unable to load booking.");}}
  void load();const timer=setInterval(()=>{void load();},15000);
  return()=>{controller.abort();clearInterval(timer)};
 },[id,version]);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setError("");setNotice("");
  try {
   const body=new FormData(event.currentTarget);const file=body.get("proof");
   if(!(file instanceof File)||!file.size||file.size>MAX_RECEIPT_BYTES)throw new Error("Choose a screenshot or PDF under 4 MB.");
   const response=await fetch(`/api/bookings/${encodeURIComponent(id)}/payment`,{method:"POST",body});
   const result=await response.json();if(!response.ok)throw new Error(result.error||"Upload failed.");
   setNotice("Screenshot submitted. Reception or administration will verify your payment.");setVersion(v=>v+1);
  }catch(e){setError(e instanceof Error?e.message:"Upload failed.");}finally{setBusy(false);}
 }
 const b=data?.booking;const settings=data?.settings;const payment=one(b?.payment_submissions);const proof=one(b?.booking_proofs);
 const remaining=b?Math.max(0,Math.ceil((Date.parse(b.hold_expires_at)-clock.now)/1000)):0;
 const expired=b?.status==="pending_payment"&&remaining<=0;
 return <div className="mx-auto max-w-3xl space-y-6">
  <BookingSteps current={3}/>
  <div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">Step 3 of 3</p><h1 className="font-display text-4xl">Payment & confirmation</h1></div>
  <p className="text-muted">Pay with EVC Plus or eDahab, upload your screenshot, then follow your confirmation here. No account is needed.</p>
  {error&&<Alert status="danger">{error}</Alert>}{notice&&<Alert status="success">{notice}</Alert>}
  {!b&&!error&&<p role="status">Loading your booking…</p>}
  {b&&settings&&<>
   <Card><div className="flex flex-wrap justify-between gap-3"><h2 className="font-display text-2xl">{b.reference}</h2><StatusBadge value={b.status}/></div>
    <p className="mt-3">{one(b.rooms)?.room_number} · {one(one(b.rooms)?.room_types)?.name}</p><p>{b.check_in} – {b.check_out}</p>
    <p className="mt-3 text-xl font-semibold">Total: USD ${Number(b.total_amount).toFixed(2)}</p>
   </Card>
   {expired&&<Alert status="warning">Your payment window expired. Do not send money for this booking. <a className="underline" href="/#book">Book again</a>. If you already sent money, keep the receipt and ask the hotel to resolve it before paying again.</Alert>}
   {b.status==="pending_payment"&&!expired&&<>
    <Alert status="info">Room held for {Math.floor(remaining/60)}:{String(remaining%60).padStart(2,"0")}. Pay and submit your screenshot before this window ends. A submitted screenshot keeps your room reserved during review.</Alert>
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
    <p className="mt-3">{b.status==="payment_submitted"?"Your screenshot is awaiting review by reception or administration.":b.status==="under_review"?"Your payment has been approved. Your booking is awaiting its blockchain proof.":["confirmed","checked_in","checked_out","completed"].includes(b.status)?"Your booking is confirmed.":b.status==="cancelled"?"This booking has been cancelled.":"After you upload your screenshot, reception or administration checks the payment. Once approved, the system records the booking proof on blockchain."}</p>
    {payment?.review_note&&<p className="mt-3">Hotel note: {payment.review_note}</p>}
    {proof&&/^0x[0-9a-f]{64}$/i.test(proof.transaction_hash)&&<p className="mt-3"><a className="underline" href={`https://amoy.polygonscan.com/tx/${proof.transaction_hash}`} target="_blank" rel="noopener noreferrer">View booking proof · {proof.status} · Amoy testnet</a></p>}
    <Button className="mt-4" variant="secondary" onClick={()=>setVersion(v=>v+1)}><RefreshCw/>Refresh status</Button>
   </Card>
   <p className="text-sm text-muted">Keep this page bookmarked in this browser. Private guest access lasts seven days. Creating an account with the same verified booking email lets you keep your booking history.</p>
   <ButtonLink variant="secondary" href="/register">Create an account (optional)</ButtonLink>
  </>}
 </div>;
}
