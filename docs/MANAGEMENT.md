# Hotel management

Administrator: zizoubariise@gmail.com. Access follows the protected profile role, not a hardcoded email.

## Administrator

- Read all bookings and customer contact records; edit booking contact name/phone and customer nationality/address. Booking email is protected because it controls verified-email ownership linking.
- Add/edit room types, capacity and USD rates; add/edit rooms, price overrides, active status and housekeeping state. Deactivate inventory instead of deleting historical records.
- Date-specific availability excludes cleaning, maintenance, inactive inventory and held/confirmed stays. Unpaid requests do not hold inventory.
- Review payment receipts through the existing payment endpoints. Cancellation here is limited to unpaid bookings; paid bookings need payment review/refund handling.
- Add/edit food menu prices, description, category and availability. Food orders preserve the item name and price at creation; changes to the menu do not change existing order prices.
- Create food orders, optionally attach to a checked-in booking, and progress pending -> preparing -> ready -> served. Cancel only pending/preparing orders.
- Grant/remove receptionist access by verified registered email. The database enforces at most three receptionist profiles, including disabled ones. Removal returns a receptionist to guest access without deleting the account or its records. This does not send invitations or create passwords: each person first registers and verifies their email.
- Date-range reports show arrivals, departures, booking value, approved payments, food order value, active rooms and receptionist count. Monetary metrics are separate, not a combined revenue total. Food-order value does not imply payment collected. Dates use Africa/Mogadishu.
- Edit operational hotel contact details and payment instructions. Currency stays USD.

## Receptionist

- View bookings/customers, rooms, room types/prices, availability, food menus and operational hotel details.
- Create reservations for guests using date-specific room availability, change housekeeping state, check confirmed guests in, check checked-in guests out, cancel unpaid bookings, and create/manage food orders. Staff-created reservations start pending payment; pricing is calculated by the database.
- Cannot change room/food pricing, staff roles or hotel settings; cannot approve payments or confirm blockchain proof.

## Implementation and remaining work

Management reads/writes use the authenticated Supabase session and RLS. Only receptionist email resolution uses a SECURITY DEFINER RPC, needed for a narrow lookup of a verified Auth identity. It checks auth.uid and active admin role before any lookup/write, locks role assignment, returns only the user ID, has a fixed empty search path and denies anonymous access. The Supabase advisor flags authenticated definer functions for review: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable.

New management modules do not need the missing service key. Original booking checkout, receipt processing, verified-email booking linking and blockchain completion still have the prerequisites recorded in BACKEND.md. These controls do not bypass payment or chain confirmation.

Public dining menu items/availability/prices and the original room cards' names/capacities/base prices now read operational database content, using the existing public layouts. The three original room designs are linked by stable booking codes so renaming a room type does not break checkout. Newly added other room types are accessible through front desk reservations and Any room checkout; custom marketing photos/pages are not automatically invented. Operational contact settings do not rewrite the original marketing copy. Food menu data is public only for available items. Public content reads fall back to original examples if the database is unavailable.

Authenticated end-to-end verification has not been performed. No test accounts were created. SQL changes are recorded in management-database.sql and already applied; do not rerun its CREATE statements.
