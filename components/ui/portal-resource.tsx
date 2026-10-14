"use client";

import { FileText, Hash, Plus, RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { formatDateTime, formatMoney, humanize } from "@/lib/format";
import { MANAGEMENT, type ManagementField, type Resource } from "@/lib/management";
import { api, errorMessage, jsonRequest } from "@/lib/portal-api";
import { useAlert } from "./alert-provider";
import { Badge, StatusBadge } from "./badge";
import { Button } from "./button";
import { DataTable, Pagination, TableToolbar, type Column } from "./data-table";
import { DetailList } from "./detail-list";
import { Drawer } from "./drawer";
import { Field } from "./field";
import { SelectField } from "./select-field";

type Row = Record<string, unknown> & { id: string };
type Page = { rows: Row[]; total: number; pageSize: number };
export type TableResource = Exclude<Resource, "hotel_settings">;

const relation = (value: unknown): Record<string, unknown> => ((Array.isArray(value) ? value[0] : value) as Record<string, unknown>) || {};
const text = (value: unknown) => (value === null || value === undefined || value === "" ? "—" : String(value));
const yesNo = (value: unknown) => <Badge status={value ? "success" : "neutral"}>{value ? "Yes" : "No"}</Badge>;
// Housekeeping wording used on screen; the stored values stay available / cleaning / maintenance.
const HOUSEKEEPING: Record<string, string> = { available: "Ready", cleaning: "Cleaning", maintenance: "Maintenance" };

const COLUMNS: Record<TableResource, Column<Row>[]> = {
  rooms: [
    { key: "room", header: "Room", cell: (r) => <span className="font-medium">{text(r.room_number)}</span> },
    { key: "type", header: "Type", cell: (r) => text(relation(r.room_types).name) },
    { key: "floor", header: "Floor", cell: (r) => text(r.floor) },
    { key: "rate", header: "Nightly rate", className: "text-right", cell: (r) => formatMoney(r.price_override ?? relation(r.room_types).base_price) },
    { key: "status", header: "Housekeeping", cell: (r) => <StatusBadge value={String(r.status)} label={HOUSEKEEPING[String(r.status)]} /> },
    { key: "active", header: "Active", cell: (r) => yesNo(r.is_active) },
  ],
  room_types: [
    { key: "name", header: "Name", cell: (r) => <span className="font-medium">{text(r.name)}</span> },
    { key: "description", header: "Description", cell: (r) => <span className="line-clamp-2 max-w-md text-muted">{text(r.description)}</span> },
    { key: "capacity", header: "Max guests", cell: (r) => text(r.capacity) },
    { key: "price", header: "Nightly price", className: "text-right", cell: (r) => formatMoney(r.base_price) },
    { key: "active", header: "Active", cell: (r) => yesNo(r.is_active) },
  ],
  food_menu: [
    { key: "name", header: "Dish", cell: (r) => <span className="font-medium">{text(r.name)}</span> },
    { key: "category", header: "Category", cell: (r) => text(r.category) },
    { key: "price", header: "Price", className: "text-right", cell: (r) => formatMoney(r.price) },
    { key: "available", header: "Available", cell: (r) => yesNo(r.is_available) },
  ],
  food_orders: [
    { key: "item", header: "Item", cell: (r) => <span className="font-medium">{text(r.item_name)}</span> },
    { key: "quantity", header: "Qty", cell: (r) => text(r.quantity) },
    { key: "total", header: "Total", className: "text-right", cell: (r) => formatMoney(Number(r.quantity) * Number(r.unit_price)) },
    { key: "booking", header: "Booking", cell: (r) => <span className="font-mono text-[13px]">{text(relation(r.bookings).reference)}</span> },
    { key: "status", header: "Status", cell: (r) => <StatusBadge value={String(r.status)} /> },
    { key: "created", header: "Ordered", cell: (r) => <span className="whitespace-nowrap">{formatDateTime(String(r.created_at))}</span> },
  ],
  guests: [
    { key: "name", header: "Name", cell: (r) => <span className="font-medium">{text(relation(r.profiles).full_name || r.booking_name)}</span> },
    { key: "phone", header: "Phone", cell: (r) => text(relation(r.profiles).phone || r.booking_phone) },
    { key: "nationality", header: "Nationality", cell: (r) => text(r.nationality) },
    { key: "address", header: "Address", cell: (r) => text(r.address) },
  ],
};

// Text matched by the search box.
const SEARCH: Record<TableResource, (r: Row) => string> = {
  rooms: (r) => `${text(r.room_number)} ${text(r.floor)} ${text(relation(r.room_types).name)}`,
  room_types: (r) => `${text(r.name)} ${text(r.description)}`,
  food_menu: (r) => `${text(r.name)} ${text(r.category)}`,
  food_orders: (r) => `${text(r.item_name)} ${text(relation(r.bookings).reference)}`,
  guests: (r) => `${text(relation(r.profiles).full_name || r.booking_name)} ${text(relation(r.profiles).phone || r.booking_phone)}`,
};

const TITLE: Record<TableResource, (r: Row) => string> = {
  rooms: (r) => `Room ${text(r.room_number)}`,
  room_types: (r) => text(r.name),
  food_menu: (r) => text(r.name),
  food_orders: (r) => text(r.item_name),
  guests: (r) => text(relation(r.profiles).full_name || r.booking_name),
};

const NOUN: Record<TableResource, string> = { rooms: "room", room_types: "room type", food_menu: "dish", food_orders: "food order", guests: "customer" };

// Order status changes allowed from each state (unchanged from the previous screen).
const ORDER_NEXT: Record<string, string[]> = { pending: ["preparing", "cancelled"], preparing: ["ready", "cancelled"], ready: ["served"] };

function FormField({ field, row, options }: { field: ManagementField; row: Row | null; options: Record<string, Row[]> }) {
  if (field.type === "checkbox") {
    return (
      <label className="flex h-11 items-center gap-2.5 text-sm font-medium">
        <input type="checkbox" name={field.name} defaultChecked={row ? Boolean(row[field.name]) : true} className="size-4 accent-[var(--brand)]" />
        {field.label}
      </label>
    );
  }
  if (field.type === "select") {
    const choices = [
      { value: "", label: "Choose…" },
      ...(field.options ?? []).map((value) => ({ value, label: HOUSEKEEPING[value] ?? humanize(value) })),
      ...(field.lookup ? (options[field.lookup] ?? []).map((r) => ({ value: r.id, label: text(r.name) })) : []),
    ];
    return <SelectField name={field.name} label={field.label} icon={SlidersHorizontal} options={choices} defaultValue={String(row?.[field.name] ?? "")} required={field.required} />;
  }
  return (
    <Field
      name={field.name}
      label={field.label}
      type={field.type || "text"}
      icon={field.type === "number" ? Hash : FileText}
      defaultValue={String(row?.[field.name] ?? "")}
      required={field.required}
      min={field.min}
      max={field.max}
      maxLength={1000}
      step={field.type === "number" ? (["floor", "capacity", "quantity"].includes(field.name) ? 1 : "0.01") : undefined}
    />
  );
}

// One management table: search, a detail/edit drawer and the role's allowed actions.
export function PortalResource({ resource, role }: { resource: TableResource; role: "admin" | "receptionist" }) {
  const showAlert = useAlert();
  const fields = MANAGEMENT[resource].fields as ManagementField[];
  const canEdit = role === "admin";
  const canAdd = resource !== "guests" && (role === "admin" || resource === "food_orders");
  // Existing food orders only change status, so they open read-only with the status buttons.
  const editing = canEdit && resource !== "food_orders";
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [roomStatus, setRoomStatus] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [options, setOptions] = useState<Record<string, Row[]>>({});

  const url = `/api/management/${resource}?page=${page}`;
  const loadKey = `${url}#${version}`;
  const [loaded, setLoaded] = useState<{ key: string; data: Page | null; error: string }>({ key: "", data: null, error: "" });
  const loading = loaded.key !== loadKey;
  const data = loading ? null : loaded.data;

  useEffect(() => {
    const controller = new AbortController();
    api<Page>(url, { signal: controller.signal })
      .then((result) => setLoaded({ key: loadKey, data: result, error: "" }))
      .catch((e) => { if (!controller.signal.aborted) setLoaded({ key: loadKey, data: null, error: errorMessage(e, "Unable to load.") }); });
    return () => controller.abort();
  }, [url, loadKey]);

  const term = search.trim().toLowerCase();
  const rows = data ? data.rows.filter((r) => (!term || SEARCH[resource](r).toLowerCase().includes(term)) && (!roomStatus || r.status === roomStatus)) : null;
  // Room numbers sort naturally (2 before 10), whatever the database's text order.
  if (resource === "rooms") rows?.sort((a, b) => text(a.room_number).localeCompare(text(b.room_number), undefined, { numeric: true }));
  const selected = data?.rows.find((r) => r.id === selectedId) ?? null;
  const drawerOpen = adding || Boolean(selected);

  async function loadLookups() {
    const next: Record<string, Row[]> = {};
    for (const field of fields) {
      if (!field.lookup || next[field.lookup]) continue;
      let p = 1;
      const all: Row[] = [];
      let result: Page;
      do { result = await api<Page>(`/api/management/${field.lookup}?page=${p++}`); all.push(...result.rows); } while (all.length < result.total);
      next[field.lookup] = all;
    }
    setOptions(next);
  }

  async function openRow(row: Row | null) {
    if ((row ? editing : canAdd) && fields.some((f) => f.lookup)) {
      setBusy(true);
      try { await loadLookups(); } catch (e) { showAlert({ status: "danger", message: errorMessage(e, "Unable to open form."), durationMs: null }); return; } finally { setBusy(false); }
    }
    setAdding(!row);
    setSelectedId(row?.id ?? null);
  }

  function close() { setAdding(false); setSelectedId(null); }

  async function send(body: Record<string, unknown>, method: "POST" | "PATCH", success: string) {
    setBusy(true);
    try {
      await api(`/api/management/${resource}`, jsonRequest(method, body));
      showAlert({ status: "success", message: success });
      setVersion((v) => v + 1);
      return true;
    } catch (e) {
      showAlert({ status: "danger", message: errorMessage(e, "Save failed."), durationMs: null });
      return false;
    } finally { setBusy(false); }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body: Record<string, unknown> = { id: selected?.id };
    for (const field of fields) body[field.name] = field.type === "checkbox" ? form.has(field.name) : String(form.get(field.name) || "");
    if (await send(body, adding ? "POST" : "PATCH", "Saved.")) close();
  }

  const rowActions = (row: Row) => {
    if (resource === "food_orders") {
      return (ORDER_NEXT[String(row.status)] ?? []).map((next) => (
        <Button key={next} size="sm" variant="secondary" disabled={busy} onClick={() => send({ id: row.id, status: next }, "PATCH", `Order ${humanize(next).toLowerCase()}.`)}>{humanize(next)}</Button>
      ));
    }
    if (resource === "rooms" && role === "receptionist") {
      return Object.entries(HOUSEKEEPING).map(([value, label]) => (
        <Button key={value} size="sm" variant={row.status === value ? "primary" : "secondary"} disabled={busy || row.status === value} onClick={() => send({ id: row.id, status: value }, "PATCH", `Room ${text(row.room_number)} marked ${label.toLowerCase()}.`)}>{label}</Button>
      ));
    }
    return null;
  };

  const columns: Column<Row>[] = [
    ...COLUMNS[resource],
    ...(resource === "food_orders" || (resource === "rooms" && role === "receptionist")
      ? [{ key: "actions", header: "", className: "text-right", cell: (r: Row) => <span className="flex justify-end gap-2">{rowActions(r)}</span> }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-4">
      <TableToolbar>
        <div className="w-full max-w-xs">
          <Field compact label="Search" name={`${resource}-search`} icon={Search} placeholder={`Find a ${NOUN[resource]}`} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {resource === "rooms" && (
          <div className="w-full max-w-[220px]">
            <SelectField compact label="Housekeeping" name="room-status" icon={SlidersHorizontal} value={roomStatus} onChange={(e) => setRoomStatus(e.target.value)} options={[{ value: "", label: "All statuses" }, ...Object.entries(HOUSEKEEPING).map(([value, label]) => ({ value, label }))]} />
          </div>
        )}
        <div className="ml-auto flex gap-2">
          <Button variant="secondary" size="sm" disabled={loading || busy} onClick={() => setVersion((v) => v + 1)}><RefreshCw aria-hidden />Refresh</Button>
          {canAdd && <Button size="sm" disabled={busy} onClick={() => openRow(null)}><Plus aria-hidden />Add {NOUN[resource]}</Button>}
        </div>
      </TableToolbar>
      {resource === "rooms" && data && (
        <div className="flex flex-wrap gap-2" aria-label="Housekeeping counts">
          {Object.entries(HOUSEKEEPING).map(([value, label]) => (
            <Badge key={value} status={value === "available" ? "success" : value === "maintenance" ? "danger" : "neutral"}>{label}: {data.rows.filter((r) => r.status === value).length}</Badge>
          ))}
        </div>
      )}
      <DataTable
        caption={MANAGEMENT[resource].title}
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        onRowClick={(r) => openRow(r)}
        selectedKey={selectedId}
        loading={loading}
        error={loading ? "" : loaded.error}
        empty={term || roomStatus ? "Nothing matches these filters on this page." : "No records yet."}
      />
      {data && <Pagination page={page} pageSize={data.pageSize} total={data.total} onPage={setPage} disabled={loading || busy} />}

      <Drawer open={drawerOpen} onClose={close} title={adding ? `Add ${NOUN[resource]}` : selected ? TITLE[resource](selected) : ""} subtitle={selected?.status ? <StatusBadge value={String(selected.status)} label={resource === "rooms" ? HOUSEKEEPING[String(selected.status)] : undefined} /> : undefined}>
        {drawerOpen && (editing || adding ? (
          <form onSubmit={save} className="flex flex-col gap-4">
            {fields.map((field) => <FormField key={field.name} field={field} row={adding ? null : selected} options={options} />)}
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={busy}>Save</Button>
              <Button variant="secondary" disabled={busy} onClick={close}>Cancel</Button>
            </div>
          </form>
        ) : selected && (
          <div className="flex flex-col gap-4">
            <DetailList items={COLUMNS[resource].map((column) => ({ label: column.header, value: column.cell(selected) }))} />
            {rowActions(selected) && <div className="flex flex-wrap gap-2">{rowActions(selected)}</div>}
          </div>
        ))}
      </Drawer>
    </div>
  );
}
