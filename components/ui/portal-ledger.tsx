"use client";

import { ExternalLink } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { StatusBadge } from "./badge";
import { DataTable, type Column } from "./data-table";

export type LedgerRow = {
  booking_id: string; reference: string; transaction_hash: string; status: string;
  block_number: number | null; created_at: string; confirmed_at: string | null;
};

const shortHash = (hash: string) => `${hash.slice(0, 10)}…${hash.slice(-8)}`;

// Booking proofs recorded on Polygon Amoy, newest first.
export function PortalLedger({ rows }: { rows: LedgerRow[] }) {
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
  ];
  return <DataTable caption="Blockchain ledger" columns={columns} rows={rows} rowKey={(r) => r.booking_id} empty="No booking proofs recorded yet. Proofs are written when a payment is approved." />;
}
