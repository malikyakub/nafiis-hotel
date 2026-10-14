"use client";

import { CalendarCheck, CalendarDays, FileText, Mail, Phone, Search, UserMinus, UserPlus } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { formatMoney, hotelToday } from "@/lib/format";
import { MANAGEMENT } from "@/lib/management";
import { api, errorMessage, jsonRequest } from "@/lib/portal-api";
import { useAlert } from "./alert-provider";
import { Badge } from "./badge";
import { Button } from "./button";
import { Card } from "./card";
import { DataTable, type Column } from "./data-table";
import { addDays, DateTimeField, type DateTime } from "./date-time-field";
import { Field } from "./field";

export type Stay = { check_in: string; check_out: string };

// Check-in and check-out with the site's calendar (date only). Calls onSubmit with a valid range.
export function StayRangeForm({ onSubmit, busy, submitLabel, minDate, children }: {
  onSubmit: (stay: Stay) => void; busy?: boolean; submitLabel: string; minDate?: string; children?: React.ReactNode;
}) {
  const showAlert = useAlert();
  const [today] = useState(() => hotelToday());
  const earliest = minDate ?? today;
  const [checkIn, setCheckIn] = useState<DateTime | null>(null);
  const [checkOut, setCheckOut] = useState<DateTime | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!checkIn || !checkOut) { showAlert({ status: "danger", message: "Choose check-in and check-out dates.", durationMs: null }); return; }
    if (checkOut.date <= checkIn.date) { showAlert({ status: "danger", message: "Check-out must be after check-in.", durationMs: null }); return; }
    onSubmit({ check_in: checkIn.date, check_out: checkOut.date });
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-start gap-3">
      <div className="w-full sm:w-56">
        <DateTimeField dateOnly label="Check-in" name="check_in" icon={CalendarDays} value={checkIn} minDate={earliest}
          onChange={(value) => { setCheckIn(value); if (!checkOut || checkOut.date <= value.date) setCheckOut({ date: addDays(value.date, 1), time: "" }); }} />
      </div>
      <div className="w-full sm:w-56">
        <DateTimeField dateOnly label="Check-out" name="check_out" icon={CalendarCheck} value={checkOut} rangeStart={checkIn?.date} align="end"
          minDate={checkIn ? addDays(checkIn.date, 1) : addDays(earliest, 1)} onChange={setCheckOut} />
      </div>
      {children}
      <Button type="submit" disabled={busy}><Search aria-hidden />{submitLabel}</Button>
    </form>
  );
}

export type AvailableRoom = { room_id: string; room_number: string; room_type: string; capacity: number; nightly_rate: number };

export const AVAILABLE_COLUMNS: Column<AvailableRoom>[] = [
  { key: "room", header: "Room", cell: (r) => <span className="font-medium">{r.room_number}</span> },
  { key: "type", header: "Type", cell: (r) => r.room_type },
  { key: "capacity", header: "Max guests", cell: (r) => r.capacity },
  { key: "rate", header: "Nightly rate", className: "text-right", cell: (r) => formatMoney(r.nightly_rate) },
];

export function PortalAvailability() {
  const showAlert = useAlert();
  const [busy, setBusy] = useState(false);
  const [rooms, setRooms] = useState<AvailableRoom[] | null>(null);

  async function search(stay: Stay) {
    setBusy(true);
    try {
      const result = await api<{ rooms: AvailableRoom[] }>(`/api/availability?${new URLSearchParams(stay)}`);
      setRooms(result.rooms);
    } catch (e) {
      showAlert({ status: "danger", message: errorMessage(e, "Lookup failed."), durationMs: null });
    } finally { setBusy(false); }
  }

  return (
    <div className="flex flex-col gap-4">
      <StayRangeForm onSubmit={search} busy={busy} submitLabel="Find rooms" />
      {rooms && <DataTable caption="Available rooms" columns={AVAILABLE_COLUMNS} rows={rooms} rowKey={(r) => r.room_id} empty="No rooms available for these dates." />}
    </div>
  );
}

const REPORT_LABELS: [key: string, label: string, money?: boolean][] = [
  ["arrivals", "Arrivals"],
  ["departures", "Departures"],
  ["cancelled_arrivals", "Cancelled bookings"],
  ["booking_value_usd", "Booking value", true],
  ["approved_payments_usd", "Approved payments", true],
  ["food_order_value_usd", "Restaurant orders", true],
  ["active_rooms", "Active rooms"],
  ["receptionists", "Receptionists"],
];

export function PortalReports() {
  const showAlert = useAlert();
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<Record<string, number> | null>(null);

  async function run(stay: Stay) {
    setBusy(true);
    try { setReport(await api(`/api/admin/reports?${new URLSearchParams(stay)}`)); }
    catch (e) { showAlert({ status: "danger", message: errorMessage(e, "Report failed."), durationMs: null }); }
    finally { setBusy(false); }
  }

  // The report counts every booking arriving in the range; arrivals shown here exclude cancelled ones.
  const value = (key: string) => key === "arrivals" && report ? Number(report.arrivals) - Number(report.cancelled_arrivals || 0) : Number(report?.[key] ?? 0);

  return (
    <div className="flex flex-col gap-5">
      <StayRangeForm onSubmit={run} busy={busy} submitLabel="View report" minDate="2024-01-01" />
      {report && (
        <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {REPORT_LABELS.map(([key, label, money]) => (
            <Card key={key} className="flex flex-col gap-1 p-5">
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="font-display text-[32px] leading-[38px]">{money ? formatMoney(value(key)) : value(key)}</dd>
            </Card>
          ))}
        </dl>
      )}
    </div>
  );
}

type Settings = Record<string, unknown>;

export function PortalSettings() {
  const showAlert = useAlert();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    api<{ rows: Settings[] }>("/api/management/hotel_settings", { signal: controller.signal })
      .then((result) => { setSettings(result.rows[0] ?? {}); setError(""); })
      .catch((e) => { if (!controller.signal.aborted) setError(errorMessage(e, "Unable to load settings.")); });
    return () => controller.abort();
  }, [version]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(MANAGEMENT.hotel_settings.fields.map((f) => [f.name, String(form.get(f.name) || "")]));
    setBusy(true);
    try {
      await api("/api/management/hotel_settings", jsonRequest("PATCH", body));
      showAlert({ status: "success", message: "Hotel settings saved." });
      setVersion((v) => v + 1);
    } catch (e) {
      showAlert({ status: "danger", message: errorMessage(e, "Save failed."), durationMs: null });
    } finally { setBusy(false); }
  }

  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (!settings) return <p role="status" className="text-sm text-muted">Loading…</p>;

  const groups: [title: string, names: string[]][] = [
    ["Hotel", ["name", "phone", "email", "address"]],
    ["Payment", ["payment_instructions", "evc_number", "evc_name", "edahab_number", "edahab_name"]],
  ];
  const fields = MANAGEMENT.hotel_settings.fields;
  return (
    <form key={version} onSubmit={save} className="flex max-w-3xl flex-col gap-6">
      {groups.map(([title, names]) => (
        <Card key={title} className="flex flex-col gap-4">
          <h2 className="font-display text-[22px] leading-7">{title}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.filter((f) => names.includes(f.name)).map((field) => (
              <Field
                key={field.name}
                name={field.name}
                label={field.label}
                type={"type" in field && field.type === "email" ? "email" : "text"}
                icon={field.name === "email" ? Mail : /number|phone/.test(field.name) ? Phone : FileText}
                defaultValue={String(settings[field.name] ?? "")}
                required={"required" in field && field.required}
                maxLength={1000}
              />
            ))}
          </div>
        </Card>
      ))}
      <Button type="submit" disabled={busy} className="w-fit">Save settings</Button>
    </form>
  );
}

type Receptionist = { id: string; full_name: string | null; phone: string | null; is_active: boolean };

export function PortalReceptionists() {
  const showAlert = useAlert();
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState<{ key: number; rows: Receptionist[] | null; error: string }>({ key: -1, rows: null, error: "" });
  const loading = loaded.key !== version;

  useEffect(() => {
    const controller = new AbortController();
    api<{ receptionists: Receptionist[] }>("/api/admin/receptionists", { signal: controller.signal })
      .then((result) => setLoaded({ key: version, rows: result.receptionists, error: "" }))
      .catch((e) => { if (!controller.signal.aborted) setLoaded({ key: version, rows: null, error: errorMessage(e, "Unable to load receptionists.") }); });
    return () => controller.abort();
  }, [version]);

  const rows = loading ? null : loaded.rows;

  async function access(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const element = event.currentTarget;
    const form = new FormData(element, (event.nativeEvent as SubmitEvent).submitter);
    setBusy(true);
    try {
      await api("/api/admin/receptionists", jsonRequest("POST", { email: form.get("email"), enabled: form.get("access") === "add" }));
      showAlert({ status: "success", message: "Receptionist access updated. Ask them to sign in again." });
      element.reset();
      setVersion((v) => v + 1);
    } catch (e) {
      showAlert({ status: "danger", message: errorMessage(e, "Update failed."), durationMs: null });
    } finally { setBusy(false); }
  }

  const columns: Column<Receptionist>[] = [
    { key: "name", header: "Name", cell: (r) => <span className="font-medium">{r.full_name || "—"}</span> },
    { key: "phone", header: "Phone", cell: (r) => r.phone || "—" },
    { key: "status", header: "Access", cell: (r) => <Badge status={r.is_active ? "success" : "neutral"}>{r.is_active ? "Active" : "Disabled"}</Badge> },
  ];

  return (
    <div className="flex flex-col gap-5">
      <DataTable caption="Receptionists" columns={columns} rows={rows} rowKey={(r) => r.id} loading={loading} error={loading ? "" : loaded.error} empty="No receptionists yet." />
      <Card className="flex max-w-xl flex-col gap-4">
        <div>
          <h2 className="font-display text-[22px] leading-7">Reception access ({rows?.length ?? 0}/3)</h2>
          <p className="mt-1 text-sm text-muted">Ask each person to register and verify their email first, then add their email here. Enter the same email to remove access.</p>
        </div>
        <form onSubmit={access} className="flex flex-col gap-4">
          <Field name="email" label="Receptionist email" type="email" icon={Mail} required />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" name="access" value="add" disabled={busy || (rows?.length ?? 0) >= 3}><UserPlus aria-hidden />Add receptionist</Button>
            <Button type="submit" name="access" value="remove" variant="secondary" disabled={busy}><UserMinus aria-hidden />Remove access</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
