import type { Metadata } from "next";
import { PortalLedger, type LedgerRow } from "@/components/ui/portal-ledger";
import { requireRole } from "@/lib/auth/require-role";
import { one, type Relation } from "@/lib/portal-api";

export const metadata: Metadata = { title: "Blockchain ledger" };

type ProofRow = Omit<LedgerRow, "reference"> & { bookings: Relation<{ reference: string }> };

export default async function Page() {
  const { supabase } = await requireRole("admin");
  const { data, error } = await supabase.from("booking_proofs")
    .select("booking_id,transaction_hash,status,block_number,created_at,confirmed_at,bookings(reference)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return <p className="text-sm text-danger">The ledger could not be loaded. Refresh to try again.</p>;
  const rows = ((data ?? []) as ProofRow[]).map(({ bookings, ...proof }) => ({ ...proof, reference: one(bookings)?.reference ?? "—" }));
  return <PortalLedger rows={rows} />;
}
