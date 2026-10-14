"use client";

import { Check, FileText, MessageSquare, RefreshCw, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { formatDateTime, formatMoney } from "@/lib/format";
import { api, errorMessage, jsonRequest, one, type Relation } from "@/lib/portal-api";
import { Alert } from "./alert";
import { useAlert } from "./alert-provider";
import { StatusBadge } from "./badge";
import { Button } from "./button";
import { DataTable, Pagination, TableToolbar, type Column } from "./data-table";
import { DetailList } from "./detail-list";
import { Drawer } from "./drawer";
import { Field } from "./field";
import { guestName, guestPhone, roomLabel, stayLabel, type Booking } from "@/lib/booking-display";
import { ChainProofLink } from "./portal-bookings";

type PaymentBooking = Pick<Booking, "check_in" | "check_out" | "rooms" | "guests" | "booking_proofs"> & { reference: string; status: string };
type Payment = {
  id: string; booking_id: string; amount: number; status: string; transfer_reference: string | null;
  created_at: string; reviewed_at: string | null; review_note: string | null;
  bookings: Relation<PaymentBooking>;
};
type Result = { payments: Payment[]; total: number; pageSize: number };

export type PaymentsView = "queue" | "history" | "all";

const asBooking = (payment: Payment) => (one(payment.bookings) ?? { check_in: "", check_out: "", reference: "", status: "" }) as Booking;

// Staff payment lists. Only the administrator approves or rejects; reception sees status only.
export function PortalPayments({ role, view }: { role: "admin" | "receptionist"; view: PaymentsView }) {
  const showAlert = useAlert();
  const canReview = role === "admin";
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const status = view === "queue" ? "submitted" : view === "history" ? "reviewed" : "";
  const url = `/api/admin/payments?${new URLSearchParams({ page: String(page), ...(status ? { status } : {}) })}`;
  const loadKey = `${url}#${version}`;
  const [loaded, setLoaded] = useState<{ key: string; result: Result | null; error: string }>({ key: "", result: null, error: "" });
  const loading = loaded.key !== loadKey;
  const result = loading ? null : loaded.result;

  useEffect(() => {
    const controller = new AbortController();
    api<Result>(url, { signal: controller.signal })
      .then((data) => setLoaded({ key: loadKey, result: data, error: "" }))
      .catch((e) => { if (!controller.signal.aborted) setLoaded({ key: loadKey, result: null, error: errorMessage(e, "Unable to load payments.") }); });
    return () => controller.abort();
  }, [url, loadKey]);

  const rows = result?.payments ?? null;
  const selected = rows?.find((p) => p.id === selectedId) ?? null;

  async function mutate(target: string, options: RequestInit, success: string) {
    setBusy(true);
    try {
      const response = await api<{ message?: string }>(target, options);
      showAlert({ status: "success", message: response.message || success });
      setVersion((v) => v + 1);
      return true;
    } catch (e) {
      showAlert({ status: "danger", message: errorMessage(e), durationMs: null });
      return false;
    } finally { setBusy(false); }
  }

  async function openReceipt(id: string) {
    setBusy(true);
    try {
      const data = await api<{ url: string }>(`/api/payments/${id}/proof`);
      window.location.assign(data.url);
    } catch (e) {
      showAlert({ status: "danger", message: errorMessage(e, "Unable to open receipt."), durationMs: null });
    } finally { setBusy(false); }
  }

  async function decide(id: string, decision: "approved" | "rejected", note: string) {
    if (decision === "rejected" && !note) {
      showAlert({ status: "danger", message: "Enter a reason before rejecting this payment.", durationMs: null });
      return;
    }
    const done = await mutate(`/api/admin/payments/${id}`, jsonRequest("PATCH", { decision, note }), decision === "approved"
      ? "Payment approved. The booking remains under review until its blockchain proof is recorded."
      : "Payment rejected and booking cancelled.");
    if (done) setSelectedId(null);
  }

  function review(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget, (event.nativeEvent as SubmitEvent).submitter);
    void decide(id, String(form.get("decision")) as "approved" | "rejected", String(form.get("note") || "").trim());
  }

  const columns: Column<Payment>[] = [
    { key: "reference", header: "Booking", cell: (p) => <span className="font-mono text-[13px]">{one(p.bookings)?.reference || "—"}</span> },
    { key: "guest", header: "Guest", cell: (p) => <span className="flex flex-col"><span className="font-medium">{guestName(asBooking(p))}</span><span className="text-xs text-muted">{guestPhone(asBooking(p))}</span></span> },
    { key: "room", header: "Room", cell: (p) => roomLabel(asBooking(p)) },
    { key: "stay", header: "Stay", cell: (p) => <span className="whitespace-nowrap">{stayLabel(asBooking(p))}</span> },
    { key: "amount", header: "Amount", className: "text-right", cell: (p) => formatMoney(p.amount) },
    { key: "transfer", header: "Receipt no.", cell: (p) => p.transfer_reference || "—" },
    { key: "submitted", header: view === "history" ? "Reviewed" : "Submitted", cell: (p) => <span className="whitespace-nowrap">{formatDateTime(view === "history" ? p.reviewed_at : p.created_at)}</span> },
    { key: "status", header: "Status", cell: (p) => <StatusBadge value={p.status} /> },
    { key: "actions", header: "", className: "text-right", cell: (p) => (
      <span className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" aria-label="Download receipt" className="w-9 px-0" disabled={busy} onClick={() => openReceipt(p.id)}><FileText aria-hidden /></Button>
        {canReview && p.status === "submitted" && (
          <>
            <Button size="sm" disabled={busy} onClick={() => decide(p.id, "approved", "")}><Check aria-hidden />Approve</Button>
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => setSelectedId(p.id)}><X aria-hidden />Reject</Button>
          </>
        )}
      </span>
    ) },
  ];

  const booking = selected ? asBooking(selected) : null;

  return (
    <div className="flex flex-col gap-4">
      <TableToolbar>
        {!canReview && <p className="text-sm text-muted">Payments are reviewed by the hotel administrator. Status only.</p>}
        <Button variant="secondary" size="sm" className="ml-auto" disabled={loading || busy} onClick={() => setVersion((v) => v + 1)}>
          <RefreshCw aria-hidden />
          Refresh
        </Button>
      </TableToolbar>
      <DataTable
        caption="Payments"
        columns={columns}
        rows={rows}
        rowKey={(p) => p.id}
        onRowClick={(p) => setSelectedId(p.id)}
        selectedKey={selectedId}
        loading={loading}
        error={loading ? "" : loaded.error}
        empty={view === "queue" ? "No payments waiting for review." : "No payments yet."}
      />
      {result && <Pagination page={page} pageSize={result.pageSize} total={result.total} onPage={setPage} disabled={loading || busy} noun="payments" />}

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title={one(selected?.bookings)?.reference ? `Payment · ${one(selected?.bookings)?.reference}` : "Payment"}
        subtitle={selected && <StatusBadge value={selected.status} />}
      >
        {selected && booking && (
          <div className="flex flex-col gap-5">
            <DetailList
              items={[
                { label: "Guest", value: guestName(booking) },
                { label: "Phone", value: guestPhone(booking) || "—" },
                { label: "Room", value: roomLabel(booking) },
                { label: "Stay", value: stayLabel(booking) },
                { label: "Amount", value: formatMoney(selected.amount) },
                { label: "Receipt number", value: selected.transfer_reference || "—" },
                { label: "Submitted", value: formatDateTime(selected.created_at) },
                ...(selected.reviewed_at ? [{ label: "Reviewed", value: formatDateTime(selected.reviewed_at) }] : []),
              ]}
            />
            {selected.review_note && <Alert status={selected.status === "rejected" ? "danger" : "info"} title="Review note">{selected.review_note}</Alert>}
            <ChainProofLink proof={one(booking.booking_proofs)} />
            <Button variant="secondary" size="sm" className="w-fit" disabled={busy} onClick={() => openReceipt(selected.id)}>
              <FileText aria-hidden />
              Download receipt
            </Button>
            {canReview && selected.status === "approved" && booking.status === "under_review" && (
              <Button variant="secondary" size="sm" className="w-fit" disabled={busy} onClick={() => mutate(`/api/staff/bookings/${selected.booking_id}/blockchain`, { method: "POST" }, "Blockchain status updated.")}>
                <RefreshCw aria-hidden />
                Check blockchain proof
              </Button>
            )}
            {canReview && selected.status === "submitted" && (
              <form className="flex flex-col gap-3 border-t border-border pt-4" onSubmit={(e) => review(e, selected.id)}>
                <Field id={`note-${selected.id}`} label="Review note" name="note" icon={MessageSquare} maxLength={1000} hint="A reason is required to reject." />
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" name="decision" value="approved" disabled={busy}><Check aria-hidden />Approve payment</Button>
                  <Button type="submit" name="decision" value="rejected" variant="danger" disabled={busy}><X aria-hidden />Reject payment</Button>
                </div>
              </form>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}

type GuestBooking = Booking & { payment_submissions?: Relation<{ id: string; status: string; amount: number; reviewed_at: string | null; review_note: string | null }> };

// The guest's own payments, read from their bookings.
export function GuestPayments() {
  const showAlert = useAlert();
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const url = `/api/bookings?page=${page}`;
  const [loaded, setLoaded] = useState<{ key: string; result: { bookings: GuestBooking[]; total: number; pageSize: number } | null; error: string }>({ key: "", result: null, error: "" });
  const loading = loaded.key !== url;

  useEffect(() => {
    const controller = new AbortController();
    api<{ bookings: GuestBooking[]; total: number; pageSize: number }>(url, { signal: controller.signal })
      .then((data) => setLoaded({ key: url, result: data, error: "" }))
      .catch((e) => { if (!controller.signal.aborted) setLoaded({ key: url, result: null, error: errorMessage(e, "Unable to load payments.") }); });
    return () => controller.abort();
  }, [url]);

  const rows = loading ? null : (loaded.result?.bookings ?? []).filter((b) => one(b.payment_submissions));

  async function openReceipt(id: string) {
    setBusy(true);
    try {
      const data = await api<{ url: string }>(`/api/payments/${id}/proof`);
      window.location.assign(data.url);
    } catch (e) {
      showAlert({ status: "danger", message: errorMessage(e, "Unable to open receipt."), durationMs: null });
    } finally { setBusy(false); }
  }

  const columns: Column<GuestBooking>[] = [
    { key: "reference", header: "Booking", cell: (b) => <span className="font-mono text-[13px]">{b.reference}</span> },
    { key: "stay", header: "Stay", cell: (b) => <span className="whitespace-nowrap">{stayLabel(b)}</span> },
    { key: "amount", header: "Amount", className: "text-right", cell: (b) => formatMoney(one(b.payment_submissions)?.amount ?? b.total_amount) },
    { key: "status", header: "Payment", cell: (b) => <StatusBadge value={one(b.payment_submissions)!.status} /> },
    { key: "note", header: "Note", cell: (b) => one(b.payment_submissions)?.review_note || "—" },
    { key: "actions", header: "", className: "text-right", cell: (b) => (
      <Button size="sm" variant="secondary" disabled={busy} onClick={() => openReceipt(one(b.payment_submissions)!.id)}><FileText aria-hidden />Receipt</Button>
    ) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <DataTable caption="My payments" columns={columns} rows={rows} rowKey={(b) => b.id} loading={loading} error={loading ? "" : loaded.error} empty="Payments you submit for your bookings appear here." />
      {loaded.result && <Pagination page={page} pageSize={loaded.result.pageSize} total={loaded.result.total} onPage={setPage} disabled={loading || busy} noun="bookings" />}
    </div>
  );
}
