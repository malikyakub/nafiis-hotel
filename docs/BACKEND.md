# Backend integration

This implementation extends the original Next.js project. The existing public pages, fonts, styles and assets are preserved. The booking form only gains a success message using its existing Alert component.

## Configuration

Set the existing NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY variables in the Next.js host; the latter accepts the Supabase publishable key. Set SUPABASE_SECRET_KEY (recommended) or the existing SUPABASE_SERVICE_ROLE_KEY as a server-only secret in that host. Never send this key to the browser or commit it. Netlify sets NETLIFY=true automatically; its trusted client-IP header supplies the booking rate bucket. Other hosts currently share a conservative five-bookings-per-hour bucket until a trusted platform adapter is configured.

The original Next.js app requires a Node-compatible server host such as its existing Netlify deployment. It cannot run on the separate static demo server.js or static Sites deployment.

The live Supabase schema changes are recorded by the migrations guest_checkout_and_customer_booking_access and private_payment_submission_and_admin_review. Their SQL is mirrored in this docs directory; do not rerun them. On 2026-10-07 the owner authorized demo inventory matching the original frontend; the repeatable data seed is recorded in demo-inventory.sql. No staff accounts were invented.

## Endpoints and actions

- Existing requestBooking server action: validates the existing two-step form, saves guest checkout transactionally, calculates price from room inventory and returns the booking reference. Repeated identical requests from the same browser are idempotent. Pending payment requests do not hold rooms; submitting payment reserves the room using the existing exclusion constraint.
- GET /api/availability?check_in=YYYY-MM-DD&check_out=YYYY-MM-DD: available rooms.
- GET /api/bookings?page=1: authenticated guest's booking history, 50 records per page. Guest checkout history links only after the customer verifies the booking email. Phone-only reservations require reception assistance.
- GET /api/staff/bookings?page=1: administrator/receptionist booking list.
- PATCH /api/staff/bookings/:id: JSON status checked_in or checked_out; conditional state transition prevents stale updates.
- POST /api/bookings/:id/payment: customer multipart proof file (PNG/JPEG/PDF, maximum 5 MB) and optional reference. Files are private; the database derives the amount from the booking.
- GET /api/admin/payments?page=1: administrator/receptionist payment queue.
- PATCH /api/admin/payments/:id: JSON decision approved/rejected and note. Rejection requires a reason. Review and its audit record commit atomically.
- GET /api/payments/:id/proof: owner, administrator or receptionist obtains a download link valid for 60 seconds.
- POST /api/staff/bookings/:id/blockchain: active admin only resumes the server-only booking proof. Approval also invokes this flow. See BLOCKCHAIN.md for configuration and guarantees.

Mutation API calls must include the same-site Origin header. Server actions use Next.js origin checks. Each endpoint verifies the current user and a protected active profile role; client-supplied roles and prices are ignored.

## Remaining setup

1. Demo inventory is configured as 30 rooms: Room 001–010 Garden ($75, 2 guests), Room 011–018 Ocean ($95, 2 guests), and Room 019–030 Family ($160, 5 guests). Numbers are stored as text to retain leading zeros. Each room has a separate category relationship.
2. Configure the server-only Supabase key on the original Next.js host, and the host's auth callback URL in Supabase.
3. zizoubariise@gmail.com is verified and was assigned administrator role and staff code ADMIN-002 on 2026-10-07. The previous administrator now has guest access; passwords and records were preserved. The obsolete email-specific provisioning function is no longer executable by application roles. Login reads the existing protected role and does not promote accounts. Three receptionist emails are pending. Never assign staff privileges from signup metadata.
4. Customer, administrator and reception screens are connected at /guest, /admin and /reception. They reuse the existing UI components without changing the original public frontend. Customer history can load directly owned bookings without a server key; linking guest-checkout reservations requires the server key and otherwise displays a notice.
5. Polygon Amoy contract, server anchoring and portal transaction links are implemented. Live operation still requires the deployed contract, trusted RPC, funded test wallet and server key. Approval leaves the booking under_review until three confirmations are verified. No hash or confirmation is fabricated. See BLOCKCHAIN.md.

Deployment and GitHub synchronization must be reported separately. Do not describe this Next.js backend as live until it is deployed with its required secrets.

## Database security review

The new checkout and review functions are service-role-only and use SECURITY INVOKER. The checkout request table intentionally has no customer policies. Existing availability and self-role lookup functions still appear in the database advisor because they use SECURITY DEFINER; they expose availability or the caller's own role, not customer records. Leaked-password protection remains disabled in project Auth settings; see https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection.
