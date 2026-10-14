"use client";

import { FileText, Link2, LogIn, LogOut, MessageSquare, RefreshCw, Search, SlidersHorizontal, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import { formatDate, formatDateTime, formatMoney, humanize } from "@/lib/format";
import { guestName, guestPhone, roomLabel, stayLabel, type Booking, type ChainProof } from "@/lib/booking-display";
import { api, errorMessage, jsonRequest, one } from "@/lib/portal-api";
import { roomTakenHref } from "@/lib/room-taken";
import { MAX_RECEIPT_BYTES } from "@/lib/upload-limits";
import { Alert } from "./alert";
import { useAlert } from "./alert-provider";
import { StatusBadge } from "./badge";
import { Button, ButtonLink } from "./button";
import { DataTable, Pagination, TableToolbar, type Column } from "./data-table";
import { DetailList } from "./detail-list";
import { Drawer } from "./drawer";
import { Field } from "./field";
import type { Portal } from "./portal-nav";
import { SelectField } from "./select-field";

type Result = { bookings: Booking[]; total: number; pageSize: number; notice?: string | null };

// Front desk tabs map to the bookings API `view` filter.
type DeskView = "arrivals" | "departures" | "in_house" | "";
const DESK_TABS: { value: DeskView; label: string }[] = [
  { value: "arrivals", label: "Arrivals today" },
  { value: "departures", label: "Departures today" },
  { value: "in_house", label: "In house" },
  { value: "", label: "All bookings" },
];
const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  ...["pending_payment", "payment_submitted", "under_review", "confirmed", "checked_in", "checked_out", "cancelled"].map((value) => ({ value, label: humanize(value) })),
];
const ROOM_TAKEN_REASON = "Room taken by another paid booking";

export function ChainProofLink({ proof }: { proof?: ChainProof }) {
  if (!proof || !/^0x[0-9a-f]{64}$/i.test(proof.transaction_hash)) return null;
  return (
    <a className="inline-flex items-center gap-1.5 text-sm text-brand underline-offset-2 hover:underline" href={`https://amoy.polygonscan.com/tx/${proof.transaction_hash}`} target="_blank" rel="noopener noreferrer">
      <Link2 aria-hidden className="size-4" />
      Booking proof · {proof.status} · Polygon Amoy
    </a>
  );
}

// Bookings table with a detail drawer. Admin sees every booking with a status filter,
// reception gets front-desk tabs, a guest sees their own bookings and can upload a receipt.
export function PortalBookings({ role }: { role: Portal }) {
  const router = useRouter();
  const showAlert = useAlert();
  const staff = role !== "guest";
  const canReview = role === "admin";
  const [desk, setDesk] = useState<DeskView>(role === "receptionist" ? "arrivals" : "");
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 30000);
    return () => { clearTimeout(first); clearInterval(timer); };
  }, []);

  const params = new URLSearchParams({ page: String(page) });
  if (desk) params.set("view", desk);
  if (status) params.set("status", status);
  if (search) params.set("q", search);
  const url = `${staff ? "/api/staff/bookings" : "/api/bookings"}?${params}`;
  // Each load is keyed by what it fetched, so loading and stale results are derived, not reset in the effect.
  const loadKey = `${url}#${version}`;
  const [loaded, setLoaded] = useState<{ key: string; result: Result | null; error: string }>({ key: "", result: null, error: "" });
  const loading = loaded.key !== loadKey;
  const result = loading ? null : loaded.result;

  useEffect(() => {
    const controller = new AbortController();
    api<Result>(url, { signal: controller.signal })
      .then((data) => setLoaded({ key: loadKey, result: data, error: "" }))
      .catch((e) => { if (!controller.signal.aborted) setLoaded({ key: loadKey, result: null, error: errorMessage(e, "Unable to load bookings.") }); });
    return () => controller.abort();
  }, [url, loadKey]);

  const rows = result?.bookings ?? null;
  const selected = rows?.find((b) => b.id === selectedId) ?? null;

  async function mutate(target: string, options: RequestInit, success: string) {
    setBusy(true);
    try {
      const response = await api<{ message?: string }>(target, options);
      showAlert({ status: "success", message: response.message || success });
      setVersion((v) => v + 1);
    } catch (e) {
      showAlert({ status: "danger", message: errorMessage(e), durationMs: null });
    } finally { setBusy(false); }
  }

  // Reconcile a submitted chain transaction while the admin has the list open.
  useEffect(() => {
    if (!canReview || busy || loading || !rows) return;
    const id = rows.find((b) => b.status === "under_review" && one(b.booking_proofs)?.status === "pending")?.id;
    if (!id) return;
    const timer = setTimeout(() => { void mutate(`/api/staff/bookings/${id}/blockchain`, { method: "POST" }, "Blockchain status updated."); }, 15000);
    return () => clearTimeout(timer);
    // mutate uses only stable setters; rows/version deliberately restart the timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canReview, busy, loading, rows]);

  async function openReceipt(paymentId: string) {
    setBusy(true);
    try {
      const data = await api<{ url: string }>(`/api/payments/${paymentId}/proof`);
      window.location.assign(data.url);
    } catch (e) {
      showAlert({ status: "danger", message: errorMessage(e, "Unable to open receipt."), durationMs: null });
    } finally { setBusy(false); }
  }

  async function upload(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const body = new FormData(event.currentTarget);
    const file = body.get("proof");
    if (!(file instanceof File) || !file.size || file.size > MAX_RECEIPT_BYTES) {
      showAlert({ status: "danger", message: "Choose a receipt under 4 MB.", durationMs: null });
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/bookings/${id}/payment`, { method: "POST", body, cache: "no-store" });
      const data = await response.json();
      // Another guest's receipt for this room was submitted first: choose another room.
      if (data.code === "room_taken") { router.push(roomTakenHref(data)); return; }
      if (!response.ok) throw new Error(data.error || "Unable to complete this request.");
      showAlert({ status: "success", message: "Receipt submitted. Your room is reserved while the hotel administrator reviews your payment." });
    } catch (e) {
      showAlert({ status: "danger", message: errorMessage(e), durationMs: null });
    } finally { setBusy(false); setVersion((v) => v + 1); }
  }

  const statusAction = (booking: Booking) =>
    staff && ["confirmed", "checked_in"].includes(booking.status) ? (
      <Button
        size="sm"
        variant="secondary"
        disabled={busy}
        onClick={() => mutate(`/api/staff/bookings/${booking.id}`, jsonRequest("PATCH", { status: booking.status === "confirmed" ? "checked_in" : "checked_out" }), booking.status === "confirmed" ? "Guest checked in." : "Guest checked out.")}
      >
        {booking.status === "confirmed" ? <LogIn aria-hidden /> : <LogOut aria-hidden />}
        {booking.status === "confirmed" ? "Check in" : "Check out"}
      </Button>
    ) : null;

  const columns: Column<Booking>[] = [
    { key: "reference", header: "Reference", cell: (b) => <span className="font-mono text-[13px]">{b.reference}</span> },
    ...(staff ? [{ key: "guest", header: "Guest", cell: (b: Booking) => <span className="flex flex-col"><span className="font-medium">{guestName(b)}</span><span className="text-xs text-muted">{guestPhone(b)}</span></span> }] : []),
    { key: "room", header: "Room", cell: (b) => roomLabel(b) },
    { key: "stay", header: "Stay", cell: (b) => <span className="whitespace-nowrap">{stayLabel(b)}</span> },
    { key: "status", header: "Status", cell: (b) => <StatusBadge value={b.status} /> },
    { key: "total", header: "Total", className: "text-right", cell: (b) => formatMoney(b.total_amount) },
    { key: "actions", header: "", className: "text-right", cell: (b) => statusAction(b) ?? (role === "guest" && b.status === "pending_payment" && Date.parse(b.payment_expires_at) > now
      ? <Button size="sm" variant="secondary" onClick={() => setSelectedId(b.id)}><Upload aria-hidden />Upload receipt</Button>
      : null) },
  ];

  const payment = selected ? one(selected.payment_submissions) : undefined;
  const expired = selected ? Date.parse(selected.payment_expires_at) <= now : false;

  return (
    <div className="flex flex-col gap-4">
      {role === "receptionist" && (
        <div role="tablist" aria-label="Front desk" className="flex flex-wrap gap-2">
          {DESK_TABS.map((tab) => (
            <Button key={tab.label} role="tab" aria-selected={desk === tab.value} size="sm" variant={desk === tab.value ? "primary" : "secondary"} onClick={() => { setDesk(tab.value); setPage(1); }}>
              {tab.label}
            </Button>
          ))}
        </div>
      )}
      <TableToolbar>
        {staff && (
          <form
            className="w-full max-w-xs"
            onSubmit={(event) => { event.preventDefault(); setSearch(query.trim()); setPage(1); }}
          >
            <Field compact label="Search" name="booking-search" icon={Search} placeholder="Booking reference" value={query} onChange={(event) => setQuery(event.target.value)} hint="Press Enter to search." />
          </form>
        )}
        {role === "admin" && (
          <div className="w-full max-w-[220px]">
            <SelectField compact label="Status" name="booking-status" icon={SlidersHorizontal} options={STATUS_OPTIONS} value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} hint="Filter the list." />
          </div>
        )}
        <Button variant="secondary" size="sm" className="mb-6 ml-auto" disabled={loading || busy} onClick={() => setVersion((v) => v + 1)}>
          <RefreshCw aria-hidden />
          Refresh
        </Button>
      </TableToolbar>
      {result?.notice && <Alert status="info">{result.notice}</Alert>}
      <DataTable
        caption="Bookings"
        columns={columns}
        rows={rows}
        rowKey={(b) => b.id}
        onRowClick={(b) => setSelectedId(b.id)}
        selectedKey={selectedId}
        loading={loading}
        error={loading ? "" : loaded.error}
        empty={role === "guest"
          ? <span className="flex flex-col items-center gap-3">Your reservations will appear here. Use the same verified email address when booking.<ButtonLink size="sm" href="/#book">Book a room</ButtonLink></span>
          : desk === "arrivals" ? "No arrivals today." : desk === "departures" ? "No departures today." : desk === "in_house" ? "No guests checked in." : "No bookings match."}
      />
      {result && <Pagination page={page} pageSize={result.pageSize} total={result.total} onPage={setPage} disabled={loading || busy} noun="bookings" />}

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title={selected?.reference ?? "Booking"}
        subtitle={selected && <StatusBadge value={selected.status} />}
        footer={selected && statusAction(selected)}
      >
        {selected && (
          <div className="flex flex-col gap-5">
            <DetailList
              items={[
                ...(staff ? [{ label: "Guest", value: guestName(selected) }, { label: "Phone", value: guestPhone(selected) || "—" }] : []),
                { label: "Room", value: roomLabel(selected) },
                { label: "Check-in", value: formatDate(selected.check_in) },
                { label: "Check-out", value: formatDate(selected.check_out) },
                { label: "Guests", value: selected.guests_count },
                { label: "Total", value: formatMoney(selected.total_amount) },
                ...(selected.created_at ? [{ label: "Booked", value: formatDateTime(selected.created_at) }] : []),
              ]}
            />
            {selected.cancellation_reason && <Alert status="warning" title="Cancelled">{selected.cancellation_reason}</Alert>}
            {role === "guest" && selected.status === "cancelled" && selected.cancellation_reason === ROOM_TAKEN_REASON && (
              <ButtonLink href={roomTakenHref(selected)}>Choose another room</ButtonLink>
            )}
            {selected.status === "pending_payment" && (
              <Alert status={expired ? "danger" : "warning"}>
                {expired
                  ? "Payment was not received within 24 hours. This booking is cancelled; do not pay for it."
                  : `Room not reserved until a receipt is submitted. Unpaid bookings are cancelled at ${formatDateTime(selected.payment_expires_at)}.`}
              </Alert>
            )}
            {selected.status === "under_review" && <p className="text-sm text-muted">Payment approved. Booking confirmation is awaiting blockchain proof.</p>}
            <ChainProofLink proof={one(selected.booking_proofs)} />

            {payment && (
              <section className="flex flex-col gap-3 border-t border-border pt-4">
                <h3 className="text-sm font-semibold">Payment</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge value={payment.status} />
                  {payment.amount !== undefined && <span className="text-sm">{formatMoney(payment.amount)}</span>}
                </div>
                {payment.review_note && <p className="text-sm">{payment.review_note}</p>}
                <Button variant="secondary" size="sm" className="w-fit" disabled={busy} onClick={() => openReceipt(payment.id)}>
                  <FileText aria-hidden />
                  Download receipt
                </Button>
              </section>
            )}

            {canReview && selected.status === "under_review" && (
              <Button variant="secondary" size="sm" className="w-fit" disabled={busy} onClick={() => mutate(`/api/staff/bookings/${selected.id}/blockchain`, { method: "POST" }, "Blockchain status updated.")}>
                <RefreshCw aria-hidden />
                Check blockchain proof
              </Button>
            )}

            {role === "guest" && selected.status === "pending_payment" && !expired && (
              <form className="flex flex-col gap-3 border-t border-border pt-4" onSubmit={(e) => { void upload(e, selected.id); }}>
                <p className="text-sm text-muted">After paying using the hotel’s instructions, upload your receipt for review.</p>
                <Field id={`proof-${selected.id}`} label="Payment receipt" name="proof" icon={Upload} type="file" accept="image/png,image/jpeg,application/pdf" required hint="PNG, JPEG or PDF, up to 4 MB." />
                <Field id={`reference-${selected.id}`} label="Receipt / transaction number" name="reference" icon={FileText} maxLength={120} required hint="The number shown on your payment receipt." />
                <Button type="submit" disabled={busy} className="w-fit">Submit receipt</Button>
              </form>
            )}

            {staff && selected.status === "pending_payment" && (
              <form
                className={cn("flex flex-col gap-3 border-t border-border pt-4")}
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  void mutate(`/api/staff/bookings/${selected.id}`, jsonRequest("PATCH", { status: "cancelled", reason: form.get("reason") }), "Unpaid booking cancelled.");
                }}
              >
                <Field id={`cancel-${selected.id}`} name="reason" label="Cancellation reason" icon={MessageSquare} maxLength={1000} required />
                <Button type="submit" variant="secondary" size="sm" className="w-fit" disabled={busy}>Cancel unpaid booking</Button>
              </form>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
