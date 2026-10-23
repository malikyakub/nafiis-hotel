"use client";

import { ExternalLink, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { formatDateTime } from "@/lib/format";
import { api, errorMessage } from "@/lib/portal-api";
import { useAlert } from "./alert-provider";
import { Badge, StatusBadge } from "./badge";
import { Button } from "./button";
import { DataTable, type Column } from "./data-table";

export type LedgerRow = {
  booking_id: string; reference: string; transaction_hash: string; status: string;
  block_number: number | null; created_at: string; confirmed_at: string | null;
};

type Verification = { status: "match" | "mismatch" | "missing" | "configuration_required"; message?: string };

const shortHash = (hash: string) => `${hash.slice(0, 10)}…${hash.slice(-8)}`;

const RESULT: Record<Verification["status"], { label: string; tone: "success" | "danger" | "warning" | "neutral"; message: string }> = {
  match: { label: "Verified", tone: "success", message: "The hash on the contract matches the stored booking proof." },
  mismatch: { label: "Mismatch", tone: "danger", message: "The hash on the contract does not match the stored booking proof." },
  missing: { label: "Not on chain", tone: "warning", message: "The contract has no proof for this booking yet." },
  configuration_required: { label: "Not checked", tone: "neutral", message: "Blockchain reads are not configured on the server." },
};

// Booking proofs recorded on Polygon Amoy, newest first. Verify re-reads the contract (read-only).
export function PortalLedger({ rows }: { rows: LedgerRow[] }) {
  const showAlert = useAlert();
  const [results, setResults] = useState<Record<string, Verification["status"]>>({});
  const [checking, setChecking] = useState<string | null>(null);

  async function verify(row: LedgerRow) {
    setChecking(row.booking_id);
    try {
      const result = await api<Verification>(`/api/admin/ledger/${row.booking_id}/verify`);
      setResults((current) => ({ ...current, [row.booking_id]: result.status }));
      const meta = RESULT[result.status];
      showAlert({ status: meta.tone === "neutral" ? "info" : meta.tone, title: `${row.reference}: ${meta.label}`, message: result.message ?? meta.message, durationMs: meta.tone === "success" ? undefined : null });
    } catch (e) {
      showAlert({ status: "danger", message: errorMessage(e, "Verification failed."), durationMs: null });
    } finally { setChecking(null); }
  }

  const columns: Column<LedgerRow>[] = [
    { key: "reference", header: "Booking", cell: (r) => <span className="font-mono text-[13px]">{r.reference}</span> },
    { key: "tx", header: "Transaction", cell: (r) => /^0x[0-9a-f]{64}$/i.test(r.transaction_hash) ? (
      <a href={`https://amoy.polygonscan.com/tx/${r.transaction_hash}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono text-[13px] text-brand hover:underline">
        {shortHash(r.transaction_hash)}<ExternalLink aria-hidden className="size-3.5" />
      </a>
    ) : "—" },
    { key: "status", header: "Status", cell: (r) => <StatusBadge value={r.status === "confirmed" ? "anchored" : r.status} /> },
    { key: "block", header: "Block", cell: (r) => r.block_number ?? "—" },
    { key: "date", header: "Recorded", cell: (r) => <span className="whitespace-nowrap">{formatDateTime(r.confirmed_at ?? r.created_at)}</span> },
    { key: "verify", header: "Check", className: "text-right", cell: (r) => (
      <span className="flex items-center justify-end gap-2">
        {results[r.booking_id] && <Badge status={RESULT[results[r.booking_id]].tone}>{RESULT[results[r.booking_id]].label}</Badge>}
        <Button size="sm" variant="secondary" disabled={checking !== null} onClick={() => verify(r)}>
          <ShieldCheck aria-hidden />
          {checking === r.booking_id ? "Checking…" : "Verify"}
        </Button>
      </span>
    ) },
  ];
  return <DataTable caption="Blockchain ledger" columns={columns} rows={rows} rowKey={(r) => r.booking_id} empty="No booking proofs recorded yet. Proofs are written when a payment is approved." />;
}
