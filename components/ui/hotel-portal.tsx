"use client";
import { MAX_RECEIPT_BYTES } from "@/lib/upload-limits";

import { useEffect, useState, type FormEvent } from "react";
import { FileText, MessageSquare, RefreshCw, Upload } from "lucide-react";
import { Button, ButtonLink } from "./button";
import { Card } from "./card";
import { Alert } from "./alert";
import { Field } from "./field";
import { StatusBadge } from "./badge";

type Relation<T> = T | T[] | null;
const one = <T,>(value: Relation<T> | undefined): T | undefined => Array.isArray(value) ? value[0] : value ?? undefined;
type ChainProof = { transaction_hash: string; status: "pending" | "confirmed" | "failed" };
function ChainProofLink({ proof }: { proof?: ChainProof }) {
  if (!proof || !/^0x[0-9a-f]{64}$/i.test(proof.transaction_hash)) return null;
  return <p className="my-3 text-sm"><a className="underline" href={`https://amoy.polygonscan.com/tx/${proof.transaction_hash}`} target="_blank" rel="noopener noreferrer">Booking proof · {proof.status} · Polygon Amoy testnet</a></p>;
}
type Booking = {
  id: string; hold_expires_at: string; reference: string; check_in: string; check_out: string; status: string;
  total_amount: number; guests_count: number; cancellation_reason?: string;
  rooms?: Relation<{ room_number: string }>;
  guests?: Relation<{ booking_name: string | null; booking_phone: string | null; profiles: Relation<{ full_name: string; phone: string }> }>;
  payment_submissions?: Relation<{ id: string; status: string; review_note: string | null }>;
  booking_proofs?: Relation<ChainProof>;
};
type Payment = { id: string; booking_id: string; amount: number; status: string; transfer_reference: string | null; review_note: string | null; bookings: Relation<{reference: string; status: string; booking_proofs: Relation<ChainProof>}> };
type Result = { bookings?: Booking[]; payments?: Payment[]; total: number; pageSize: number; notice?: string | null };
type View = "bookings" | "payments";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...options });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Unable to complete this request.");
  return body;
}

export function HotelPortal({ role }: { role: "guest" | "admin" | "receptionist" }) {
  const [now,setNow]=useState(0);
  useEffect(()=>{setNow(Date.now());const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer)},[]);
  const [view, setView] = useState<View>("bookings");
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const endpoint = view === "payments" ? "/api/admin/payments" : role === "guest" ? "/api/bookings" : "/api/staff/bookings";

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(""); setResult(null);
    request<Result>(`${endpoint}?page=${page}`, { signal: controller.signal })
      .then(setResult).catch(e => { if (!controller.signal.aborted) setError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [endpoint, page, version]);

  // Reconcile real submitted transactions while a staff portal is open.
  // Missing configuration does not start a polling loop or create placeholder proofs.
  useEffect(() => {
    if (role === "guest" || busy || loading || !result) return;
    const id = result.bookings?.find(b => b.status === "under_review" && one(b.booking_proofs)?.status === "pending")?.id
      || result.payments?.find(p => one(p.bookings)?.status === "under_review" && one(one(p.bookings)?.booking_proofs)?.status === "pending")?.booking_id;
    if (!id) return;
    const timer = setTimeout(() => { void mutate(`/api/staff/bookings/${id}/blockchain`, { method: "POST" }, "Blockchain status updated."); }, 15000);
    return () => clearTimeout(timer);
    // mutate uses only stable setters; result/version deliberately restart the timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, busy, loading, result]);

  async function mutate(url: string, options: RequestInit, success: string) {
    setBusy(true); setError(""); setNotice("");
    try { const response = await request<{message?:string}>(url, options); setNotice(response.message || success); setVersion(v => v + 1); }
    catch (e) { setError(e instanceof Error ? e.message : "Please try again."); }
    finally { setBusy(false); }
  }
  async function proof(id: string) {
    setBusy(true); setError("");
    try {
      const data = await request<{url: string}>(`/api/payments/${id}/proof`);
      window.location.assign(data.url);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to open receipt."); }
    finally { setBusy(false); }
  }
  function upload(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const body = new FormData(event.currentTarget);
    const file = body.get("proof");
    if (!(file instanceof File) || !file.size || file.size > MAX_RECEIPT_BYTES) {
      setError("Choose a receipt under 4 MB."); return;
    }
    void mutate(`/api/bookings/${id}/payment`, { method: "POST", body }, "Receipt submitted. The hotel will review your payment.");
  }
  function review(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget, (event.nativeEvent as SubmitEvent).submitter);
    const decision = String(form.get("decision"));
    const note = String(form.get("note") || "").trim();
    if (decision === "rejected" && !note) { setError("Enter a reason before rejecting this payment."); return; }
    void mutate(`/api/admin/payments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision, note }) }, decision === "approved" ? "Payment approved. The booking remains under review until its blockchain proof is recorded." : "Payment rejected and booking cancelled.");
  }
  return <div className="space-y-6">
    <div className="flex flex-wrap gap-2" aria-label="Portal sections">
      {role !== "guest" && <>
        <Button variant={view === "bookings" ? "primary" : "secondary"} onClick={() => { setView("bookings"); setPage(1); setNotice(""); }}>Bookings</Button>
        <Button variant={view === "payments" ? "primary" : "secondary"} onClick={() => { setView("payments"); setPage(1); setNotice(""); }}>Payments</Button>
      </>}
      <Button variant="secondary" disabled={loading || busy} onClick={() => setVersion(v => v + 1)}><RefreshCw />Refresh</Button>
    </div>
    {error && <Alert status="danger">{error}</Alert>}
    {notice && <Alert status="success">{notice}</Alert>}
    {result?.notice && <Alert status="info">{result.notice}</Alert>}
    {loading && <p role="status" className="text-muted">Loading {view}…</p>}
    {result && result.total === 0 && <Card><h2 className="font-display text-2xl">{view === "payments" ? "No payments to review" : "No bookings yet"}</h2><p className="mt-2 text-muted">{role === "guest" ? "Your reservations will appear here. Use the same verified email address when booking." : "New reservations and payment submissions will appear here."}</p>{role === "guest" && <ButtonLink className="mt-4" href="/#book">Book a room</ButtonLink>}</Card>}
    <div className="grid gap-5 lg:grid-cols-2">
      {result?.bookings?.map(booking => {
        const guest = one(booking.guests); const profile = one(guest?.profiles); const payment = one(booking.payment_submissions);
        return <Card key={booking.id}>
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-2xl">{booking.reference}</h2><StatusBadge value={booking.status} /></div>
          <dl className="my-5 grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-muted">Check-in</dt><dd>{booking.check_in}</dd></div>
            <div><dt className="text-muted">Check-out</dt><dd>{booking.check_out}</dd></div>
            <div><dt className="text-muted">Room</dt><dd>{one(booking.rooms)?.room_number || "Awaiting assignment"}</dd></div>
            <div><dt className="text-muted">Total · USD</dt><dd>${Number(booking.total_amount).toFixed(2)}</dd></div>
            <div><dt className="text-muted">Guests</dt><dd>{booking.guests_count}</dd></div>
            {guest && <div><dt className="text-muted">Guest contact</dt><dd>{profile?.full_name || guest.booking_name}<br />{profile?.phone || guest.booking_phone}</dd></div>}
          </dl>
          {booking.cancellation_reason && <Alert status="warning">{booking.cancellation_reason}</Alert>}
          {booking.status === "under_review" && <p className="mb-4 text-sm text-muted">Payment approved. Booking confirmation is awaiting blockchain proof.</p>}
          <ChainProofLink proof={one(booking.booking_proofs)} />
          {role !== "guest" && booking.status === "under_review" && <Button className="mb-4" variant="secondary" disabled={busy} onClick={() => mutate(`/api/staff/bookings/${booking.id}/blockchain`, { method: "POST" }, "Blockchain status updated.")}>Check blockchain proof</Button>}
          {payment && <div className="mb-4 space-y-2"><StatusBadge value={payment.status} />{payment.review_note && <p className="text-sm">{payment.review_note}</p>}<Button variant="secondary" disabled={busy} onClick={() => proof(payment.id)}><FileText />Download receipt</Button></div>}
          {booking.status === "pending_payment" && <p className="mb-3 text-sm">{Date.parse(booking.hold_expires_at)<=now?"Payment window expired. Do not pay; create a new booking.":`Payment deadline: ${new Date(booking.hold_expires_at).toLocaleString()}`}</p>}
          {role === "guest" && booking.status === "pending_payment" && Date.parse(booking.hold_expires_at)>now && <form className="space-y-3 border-t border-border pt-4" onSubmit={e => upload(e, booking.id)}>
            <p className="text-sm text-muted">After paying using the hotel’s instructions, upload your receipt for review.</p>
            <Field id={`proof-${booking.id}`} label="Payment receipt" name="proof" icon={Upload} type="file" accept="image/png,image/jpeg,application/pdf" required hint="PNG, JPEG or PDF, up to 4 MB." />
            <Field id={`reference-${booking.id}`} label="Transfer reference (optional)" name="reference" icon={FileText} maxLength={120} />
            <Button type="submit" disabled={busy}>Submit receipt</Button>
          </form>}
          {role !== "guest" && ["confirmed", "checked_in"].includes(booking.status) && <Button disabled={busy} onClick={() => mutate(`/api/staff/bookings/${booking.id}`, { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({status: booking.status === "confirmed" ? "checked_in" : "checked_out"}) }, "Booking updated.")}>{booking.status === "confirmed" ? "Check in" : "Check out"}</Button>}
          {role !== "guest" && booking.status === "pending_payment" && <form className="mt-4 space-y-3" onSubmit={event=>{event.preventDefault();const form=new FormData(event.currentTarget);void mutate(`/api/staff/bookings/${booking.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"cancelled",reason:form.get("reason")})},"Unpaid booking cancelled.")}}><Field id={`cancel-${booking.id}`} name="reason" label="Cancellation reason" icon={MessageSquare} maxLength={1000} required/><Button type="submit" variant="secondary" disabled={busy}>Cancel unpaid booking</Button></form>}
        </Card>;
      })}
      {result?.payments?.map(payment => <Card key={payment.id}>
        <div className="flex flex-wrap justify-between gap-3"><h2 className="font-display text-2xl">{one(payment.bookings)?.reference || "Booking payment"}</h2><StatusBadge value={payment.status} /></div>
        <p className="my-4">USD ${Number(payment.amount).toFixed(2)}{payment.transfer_reference && ` · ${payment.transfer_reference}`}</p>
        <Button variant="secondary" disabled={busy} onClick={() => proof(payment.id)}><FileText />Download receipt</Button>
        {payment.review_note && <p className="mt-3 text-sm">{payment.review_note}</p>}
        <ChainProofLink proof={one(one(payment.bookings)?.booking_proofs)} />
        {payment.status === "approved" && one(payment.bookings)?.status === "under_review" && <Button className="mt-3" variant="secondary" disabled={busy} onClick={() => mutate(`/api/staff/bookings/${payment.booking_id}/blockchain`, { method: "POST" }, "Blockchain status updated.")}>Check blockchain proof</Button>}
        {payment.status === "submitted" && <form className="mt-5 space-y-3" onSubmit={e => review(e, payment.id)}>
          <Field id={`note-${payment.id}`} label="Review note" name="note" icon={MessageSquare} maxLength={1000} hint="A reason is required for rejection." />
          <div className="flex flex-wrap gap-2"><Button type="submit" name="decision" value="approved" disabled={busy}>Approve payment</Button><Button type="submit" name="decision" value="rejected" variant="danger" disabled={busy}>Reject payment</Button></div>
        </form>}
      </Card>)}
    </div>
    {result && result.total > 0 && <div className="flex flex-wrap items-center gap-3"><Button variant="secondary" disabled={page === 1 || loading || busy} onClick={() => setPage(p => p - 1)}>Previous</Button><span className="text-sm">Page {page} of {Math.max(1, Math.ceil(result.total / result.pageSize))} · {result.total} {view}</span><Button variant="secondary" disabled={page * result.pageSize >= result.total || loading || busy} onClick={() => setPage(p => p + 1)}>Next</Button></div>}
  </div>;
}
