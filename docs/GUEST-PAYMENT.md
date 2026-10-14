# Account-optional booking and mobile-money payment

Public booking saves an anonymous guest reservation regardless of any staff login.
After success, **Continue to payment** opens `/booking/<booking-id>` in the same
browser. Guests see the total and the hotel's EVC Plus/eDahab receiving numbers,
pay through their mobile-money service, and upload the screenshot without login.
No provider API integration, embedded transfer or automatic debit is implemented.
The hotel must check its actual received funds before approving a screenshot.

Administrator → Hotel settings contains both receiving numbers and optional
account names, plus additional payment instructions. The owner supplied these
public receiving numbers on 2026-10-08: EVC Plus 252619850667 and eDahab 252623500617.
Account names were not supplied and have not been invented. No PIN is collected.

The guest page shows payment review and blockchain status, polling every 15
seconds. Active administrators review in Payments (receptionists see status only). Approval starts
the existing Amoy booking-proof flow; it remains under review until chain receipt
verification succeeds. Blockchain records the hotel's attestation, not an
independent judgment about a screenshot or bank/mobile-money transfer.

## Access protection

- Booking UUIDs and references alone never grant access.
- Successful checkout issues an HMAC-authenticated, HTTP-only, SameSite cookie
  tied to the random checkout-browser cookie and booking ID. Access expires in
  seven days; cookies are Secure in production. Use HTTPS in production.
- Guest booking reads and uploads validate that capability before using the
  server-only Supabase client. Uploads also enforce same-origin requests and the
  existing file size/signature limits. Receipts remain in private Storage.
- The new guest-payment RPC is callable only by service_role. It checks that the
  booking belongs to an anonymous guest, locks its pending state, derives the
  amount, verifies the attachment path and writes submission/audit atomically.
- Anonymous audit entries use action submitted_guest and a null actor, not a
  fabricated account. Staff review retains real actor IDs. Existing authenticated
  customer upload stays available. Later verified-email linking allows the
  customer to read their booking and receipt through ownership-scoped RLS.
- A copied URL in a different browser cannot access the reservation. Clearing
  cookies loses guest access. Optional accounts with the same verified booking
  email provide longer-lived booking history.
- Pending unpaid bookings do not reserve inventory. The first receipt submitted
  reserves the room and cancels overlapping unpaid bookings; a later guest gets
  409 `code: "room_taken"` and is sent back to the booking form with their dates.
  Unpaid bookings are cancelled after 24 hours (docs/booking-expiry-24h.sql).
  Automated refunds and provider settlement callbacks remain out of scope.

Migration: account_optional_guest_payment_checkout, mirrored in
docs/guest-payment-checkout.sql. Applied to the configured Supabase project.
TypeScript compilation passed. No real transfer, receipt submission or blockchain
transaction was performed to exercise this flow.

Security advisor review retained the existing intentional service-only tables
without client policies and existing role-helper/availability function notices.
The existing Auth leaked-password protection warning remains; configuration guide:
https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection.
