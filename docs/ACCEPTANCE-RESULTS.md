# Local acceptance results - 2026-10-08
## Checkout verified - 2026-10-09

Owner clicked Check out for demo BK-000002 and reported done. Read-only database verification returned checked_out, payment approved and proof confirmed; booking updated_at was 2026-10-09 08:03:48.412655 UTC. Notion checkout task marked complete. This supersedes earlier pending-checkout notes. No real mobile-money payment, assistant booking mutation or new chain transaction. Live receptionist/rejection, elapsed-expiry and hosted checks remain pending.

## Staff form reliability - 2026-10-09

Fixed null/non-object JSON returning server errors in four staff mutation endpoints. `npm run check:local` runs upload, request-security, payment-review and staff-form checks; all passed. Invalid inputs are rejected with HTTP 400 before database access. TypeScript and production build passed with 27 generated pages. Staff tests use dependency doubles; live acceptance remains pending.

## Request security and payment review checks - 2026-10-09

- `node contracts/scripts/check-request-security.mjs`: passed origin restrictions, production origin validation, guest-cookie security flags, browser/booking binding, expired/tampered token and missing-secret denial. Framework cookie store simulated in memory; no real credentials used.
- `node contracts/scripts/check-payment-review.mjs`: passed origin/session denial, staff roles, note/decision validation, rejection without chain call, stale-review conflict and approval chain dispatch. Supabase, auth and chain dependencies simulated explicitly. Live staff browser/RLS workflow remains pending.
- No live records, accounts, payments or blockchain transactions changed by these tests.

## Receipt upload regression - 2026-10-09

Passed local checks for exact byte boundary, missing/false/oversized Content-Length, malformed multipart, unsupported content type and cancellation of an oversized stream. Run `node contracts/scripts/check-upload-limit.mjs`. No network, real payments or database fixtures used. TypeScript and production build passed with 27 generated pages after this change. Hosted verification remains pending.

## Security and concurrency follow-up - 2026-10-09

- Two real temporary guest accounts passed ownership isolation: own booking visible, cross-customer read/cancel denied, receipt read/download denied, direct payment approval RPC denied. Two simultaneous insert requests for one room/stay produced one success and one exclusion rejection.
- Found and fixed disabled-customer RLS gap: current_guest_id now requires an active guest profile, and payment owner reads require an active guest role. Migration restrict_disabled_customer_record_access applied; regression with existing session passed. All fixture accounts, guests, wallets, bookings, payment/audit rows and receipt objects removed. No existing user account was modified.
- Added read-only deployment:check script; current result is missing SITE_URL. Requires the actual final hosting origin, not a placeholder. No secrets printed.
- Remaining: demo checkout via staff UI (browser policy blocked), receptionist/rejection workflow, elapsed expiry boundary, hosted auth/reset URLs, leaked-password protection, final hosting environment. GitHub upload remains deferred. No new chain transaction in these tests.


Demo booking: BK-000002, ID 7369efce-5ca2-478a-a66b-2cc48c371719. Guest name explicitly says DEMO TEST - No real payment. Receipt and staff review note also state no money was transferred. This record is retained as test evidence and is not actual hotel revenue.

## Passed

- Browser created booking without an account through the three-step form.
- Payment page displayed Room 001, Garden category, USD75 and a live hold countdown.
- Browser uploaded a PNG demo receipt successfully (HTTP201); payment became submitted. The earlier Origin rejection did not recur.
- Fresh requests without cookies received HTTP403 for the private checkout and HTTP401 for staff bookings, payment review queue and customer history.
- Availability for October 10-11 returned 29 rooms and excluded Room 001.
- User signed in as administrator. Browser approved only BK-000002 with an explicit demo note.
- Proof progressed from pending to confirmed. One transient RPC failure and wallet-lease contention recovered through existing reconciliation without a replacement transaction.
- Guest page displayed Confirmed and a real Amoy proof link.
- Staff Check in succeeded; read-only database inspection confirmed checked_in, approved payment and confirmed proof.

Proof: https://amoy.polygonscan.com/tx/0x12b8fa88b49c24161c40f5da15f7607cb9a72c2e9bd9ccd07520e75c95a6b486

## Pending

- Checkout: resumed browser access was blocked by the browser tool's URL security policy. No alternate browser or direct mutation was used to bypass it. Owner was asked to click Check out for BK-000002, after which its persisted state can be inspected.
- Receptionist and cross-customer role isolation, rejection flow, simultaneous booking contention, expired-hold boundary behavior and production authentication redirects have not been exercised end to end.
- Hosting and GitHub upload remain separate and incomplete.

The existing BK-000001 was not intentionally modified by this acceptance test; activity observed in another user tab is not attributed to these checks.

## Additional preparation - 2026-10-09

- Rolled-back database assertions passed: 30-minute deadline, exclusion from availability, overlapping hold rejected, adjacent stay accepted, deadline editing ignored and confirmation without proof rejected. No test rows persisted; reference sequence gaps are expected. Reproducible SQL: acceptance-rollback.sql. This is not a multi-connection race test.
- Sensitive checkout, receipt, review, linking and chain RPCs have no anon/authenticated execution grants. An authenticated caller with no hotel profile saw no bookings, payments or proofs under RLS. This does not replace two-real-customer isolation tests.
- BK-000002 remains checked_in as of this inspection; browser checkout verification still pending. No browser-policy workaround attempted.
- New receipt uploads limited consistently to 4 MB to fit Netlify binary request limits with overhead. Historical receipts up to 5 MB remain readable by blockchain processing. Confirmation clears the obsolete upload-pending notice.
- Added netlify.toml with Next build/publish settings and Node22. Host secrets and final URL are not configured, and nothing was published. TypeScript passed; final production build passed on 2026-10-09.
