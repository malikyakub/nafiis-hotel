# Backend review — 2026-10-11

Scope: room inventory and housekeeping, reservations and guest records, payment submissions/review, and the staff APIs. The original Next.js app is the implementation target. Public frontend design, auth, and blockchain routes were left untouched.

## Changes made locally

- `POST /api/staff/reservations` now rechecks date-specific room availability on the server and rejects a room when the submitted guest count exceeds the room's returned capacity. This closes the gap where the form showed capacity but a crafted request could create an oversized front-desk booking. The database RPC still needs the corresponding authoritative guard (see proposed shared schema changes).
- `GET /api/admin/reports` now round-trips both date parameters through ISO date formatting before calling Postgres. Values such as February 31 are rejected as HTTP 400 instead of being normalized into another day or reaching the RPC.
- No tests were added or run, per the task instructions. TypeScript verification passed with the bundled Node runtime using `node_modules/typescript/bin/tsc --noEmit --pretty false`.

## API contract for the hotel operations interface

All API responses are `application/json`, private and `no-store`. Mutations require a same-origin `Origin` header and an active staff session. Errors use `{ "error": string }`.

| Endpoint | Access | Request | Success response / behavior |
| --- | --- | --- | --- |
| `GET /api/availability?check_in=YYYY-MM-DD&check_out=YYYY-MM-DD` | Public read | Dates; 1–60 nights | `{ rooms: [{ room_id, room_number, floor, room_type_id, room_type, capacity, nightly_rate }] }`. Excludes unavailable dates, inactive inventory, cleaning and maintenance rooms. |
| `POST /api/staff/reservations` | Admin or receptionist | JSON `{ room_id, name, phone, email, check_in, check_out, guests }` | `201 { reference }`. Capacity and availability failures return 400/409. Booking price and persistence are database-owned. A new staff booking starts as `pending_payment`. |
| `GET /api/staff/bookings?page=1` | Admin or receptionist | 50 rows per page | `{ bookings, total, page, pageSize }`; each row includes booking state, dates, amount, room, guest contact relation, payment state and proof state. |
| `PATCH /api/staff/bookings/:id` | Admin or receptionist | `{ status: "checked_in" }`, `{ status: "checked_out" }`, or `{ status: "cancelled", reason }` | `{ booking: { id, reference, status } }`. Check-in/out are conditional transitions; cancellation here is only for `pending_payment`. Stale or disallowed transitions return 409. |
| `GET /api/management/:resource?page=1` | Admin or receptionist | Resource is `rooms`, `room_types`, `food_menu`, `food_orders`, `guests`, or `hotel_settings` | `{ rows, total, page, pageSize }`; 50 rows per page. Receptionists may read all listed sections. |
| `POST /api/management/:resource` | Admin; receptionists only for food orders | Resource form fields are described by `MANAGEMENT` in `lib/management.ts` | `{ saved: true }`. Guest/settings creation is disabled. Food-order price and item snapshot are set by the database trigger, not trusted from the client. |
| `PATCH /api/management/:resource` | Admin; receptionists for room housekeeping and food-order transitions | `{ id, ...resourceFields }`; food-order updates accept status only | `{ saved: true }`. Receptionists can set room status to `available`, `cleaning`, or `maintenance`; food orders follow pending → preparing → ready → served, with cancellation only from pending/preparing. |
| `GET /api/admin/reports?check_in=YYYY-MM-DD&check_out=YYYY-MM-DD` | Admin | Half-open date interval `[check_in, check_out)` in Africa/Mogadishu | Object with `arrivals`, `departures`, `cancelled_arrivals`, `booking_value_usd`, `approved_payments_usd`, `food_order_value_usd`, `active_rooms`, and `receptionists`. Monetary figures are separate measures, not one collected-revenue total. |
| `GET /api/admin/payments?page=1` | Admin or receptionist | 50 rows per page | `{ payments, total, page, pageSize }`. |
| `PATCH /api/admin/payments/:id` | Admin or receptionist | `{ decision: "approved" | "rejected", note }` | Rejection requires a reason. Review persists atomically; approval starts server-side proof anchoring and can return its `{ status, message }` result. |
| `GET /api/payments/:id/proof` | Booking owner, admin or receptionist | Payment UUID | `{ url, expiresIn: 60 }`; link is short-lived. |

The operations UI currently uses `/api/availability`, `/api/staff/reservations`, `/api/management/:resource`, `/api/admin/reports`, and `/api/admin/receptionists`. The richer staff booking/payment actions are consumed by the portal component. These shapes match the present source; a future route change should update the corresponding client and this contract together.

## Findings for shared database review

1. **Front-desk capacity is not enforced in the database RPC.** Live `front_desk_booking` validates a guest range of 1–20 and room availability, but never compares guest count with `room_types.capacity`. The local HTTP preflight now closes the web endpoint path. Direct authenticated RPC calls and any future caller still need a database guard. Proposed change: inside `front_desk_booking`, after locking and resolving the room, reject when `p_guests` exceeds that room type's capacity. Keep the existing active admin/receptionist check and date/availability checks.
2. **Receipt submission can race hold expiry.** `POST /api/bookings/:id/payment` checks `hold_expires_at` before reading and uploading the multipart receipt. The live `submit_booking_payment` and `submit_guest_booking_payment` functions lock the booking and check `pending_payment`, but do not recheck the hold deadline. A sufficiently slow upload can therefore submit after the hold expires. Proposed change: in both RPCs, after `SELECT ... FOR UPDATE`, require `hold_expires_at > clock_timestamp()` before inserting the payment row or moving the booking to `payment_submitted`. Keep the HTTP check as an early user-facing response; the locked database check must be authoritative.
3. **Migration provenance needs reconciliation before applying either proposal.** This checkout's `supabase/migrations` contains only `.gitkeep`, while `docs/BACKEND.md` refers to applied migration names and SQL mirrors. The read-only live functions contain later behavior than some mirrored SQL snippets. Do not apply a hand-built migration until the actual migration history/source is recovered and reviewed. No DDL was run.
4. **Backend setup notes have a stale upload limit.** `docs/BACKEND.md` describes a 5 MB receipt maximum, but the current shared upload constants and endpoint enforce 4 MB. The review contract follows the current code.

## Read-only inspection and boundaries

- The connected `nafiis-hotel` Supabase project was inspected read-only. Current public tables have RLS enabled; the live schema includes the expected rooms, bookings, guests, payment, food-order, and audit records. Function definitions confirmed the two gaps above.
- No customer, payment, credential, or secret values were queried or recorded. No accounts, rows, settings, storage objects, migrations, or transactions were changed.
- No auth/login, UI, or blockchain route files were edited. No deployment, GitHub push, or publication occurred.

## Dependencies and remaining work

- The database RPC fixes need review against the authoritative migration history before any shared schema change is proposed as a migration.
- Customer email delivery remains deferred by the user. Existing account linking is verified-email based; phone-only bookings remain a reception-assisted workflow.
- GitHub source sync and deployment remain outside this workstream and are not claimed as complete.
