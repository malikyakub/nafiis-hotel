# Blockchain integration review — 2026-10-11

## Scope and outcome

Reviewed `lib/chain`, the booking-proof contract and ABI, the payment approval and proof API routes, and `docs/booking-blockchain.sql` / `docs/BLOCKCHAIN.md`. No database changes, chain calls, test runs, deployment, or non-chain API edits were made. No private wallet values were read.

No blocking contract or server integration defect was found in the reviewed path. The contract interface is unchanged, so the deployed Amoy registry remains compatible. The bounded documentation correction in `BLOCKCHAIN.md` replaces stale statements that deployment and proof verification had not happened. Project handoff evidence records the demo proof and owner-performed checkout as verified by 2026-10-09.

## Data boundary

- **On chain:** Polygon Amoy (chain 80002) stores a random per-booking `bookingKey` and a SHA-256 hash (`proofHash`). The `BookingAnchored` event and `proofs(bookingKey)` mapping expose those opaque values. No guest identity, contact details, receipt bytes, payment reference, or booking terms are submitted to the contract.
- **Service-only database:** `booking_chain_jobs` stores the canonical snapshot, salted booking/payment snapshot, receipt SHA-256, signed transaction bytes, actor, wallet/contract addresses, hash, and reconciliation state. The lease table coordinates one wallet. The `service_role` is the only table writer/reader for jobs and lease.
- **Booking-visible database:** `booking_proofs` stores the opaque keys/hashes, chain/contract/transaction identifiers, state and confirmation block/time. Authenticated reads are granted under a policy requiring a corresponding booking row; booking RLS limits customer visibility. Signed transaction bytes and the private snapshot are not in this table.
- **Payment evidence:** customer uploads remain in private `payment-proofs` storage. The server reads the receipt to compute its digest after an active staff member has approved the payment. Staff must independently confirm actual EVC/eDahab funds; neither the screenshot nor this blockchain proof authenticates a transfer.

## Authorization, idempotency, and reconciliation

- `PATCH /api/admin/payments/[id]` enforces same-origin and active admin/reception role, validates the decision/note, and calls `review_booking_payment`. The database function locks the submitted payment and booking state, records reviewer/time and audit row, and advances approval once. A repeated approval is rejected as stale; if chain processing is pending, staff use the dedicated blockchain reconciliation route rather than re-reviewing.
- `anchorBooking` performs a fresh role check on every call. It checks approved payment and `under_review` booking state plus amount agreement before preparing a proof. The database preparation RPC repeats the active staff, lease, booking, payment, and amount checks.
- The contract authorizes only its immutable registrar. Repeating the same key/hash is a no-op; conflicting data reverts. The server persists signed transaction bytes and their hash before broadcast, then only rebroadcasts those exact bytes. A unique pending-job index and lease serialize nonce allocation.
- Confirmation waits for three confirmations, checks the receipt sender/contract/hash and canonical block, requires the matching event and stored contract mapping, then atomically finalizes the job/proof and booking through the service RPC. Failed/reverted transactions do not confirm a booking. No unattended worker exists; staff actions and an open staff list drive reconciliation.

## Dependencies and operational gaps

- The application depends on deployed schema `booking_only_amoy_proofs` (represented by `docs/booking-blockchain.sql`): `booking_chain_jobs`, `booking_chain_lease`, `booking_proofs`; RPCs `acquire_booking_chain_lease`, `release_booking_chain_lease`, `prepare_booking_chain_job`, `finish_booking_chain_job`; and trigger `guard_booking_proof_fields` on `bookings`. It also depends on existing `bookings`, `payment_submissions`, `payment_audit`, `profiles`, `auth_role()`, and private `payment-proofs` storage. This review did not apply or reapply SQL.
- Runtime needs `SUPABASE_SECRET_KEY` (or the supported service-role alias), `AMOY_RPC_URL`, `SYSTEM_WALLET_PRIVATE_KEY`, and `PROOF_REGISTRY_ADDRESS`. The wallet must be the registry registrar, use chain 80002, and hold test POL. This review checked no secret values. The project handoff marks the Amoy demo as successful; hosted production environment configuration remains a separate dependency.
- No automatic nonce replacement or fee bumping is implemented. A stuck transaction blocks later proofs until an operator resolves it. Reverted jobs are terminal in this flow and require operator diagnosis; avoid manual database edits or replacement broadcasts without a reconciliation plan.
- Three confirmations and a canonical-block check are the demo finality policy, not protection against arbitrarily deep reorgs. There is no scheduled reconciliation worker, alerting, or transaction replacement workflow.
- The demo used no real mobile-money payment. Receipt authenticity and actual account settlement remain manual staff responsibilities. Do not describe a confirmed on-chain proof as proof that funds were transferred.

## Verification record

The project status records the deployed Amoy registry and its verified deployment on 2026-10-08. It records demo proof `0x12b8fa88b49c24161c40f5da15f7607cb9a72c2e9bd9ccd07520e75c95a6b486` and read-only status verification for the demo booking on 2026-10-09. Those are prior checks; this review did not send a transaction or repeat verification. No tests were run per the task instructions. GitHub upload and deployment were not performed.
