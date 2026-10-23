# Hotel operations review — 2026-10-11

## Completed

- Added a housekeeping panel to the existing Rooms management screen in `components/ui/management-panel.tsx`.
- Reception and administrators can search the currently loaded room page by room number, floor, or room type, and filter by Ready, Cleaning, or Maintenance.
- Added room-status counts for the loaded page. Existing role checks and room status update API remain the source of write permissions and state.
- Reused the existing `Field`, `Card`, `Button`, and current light UI styling. No public hotel page or shared design tokens changed.
- Read the bundled Next.js 16 Route Handlers and Server/Client Components guides before editing. This change stays within the existing client component and API patterns.

## API findings and backend requirements

- `GET /api/management/rooms?page=N` returns 50 rooms and an exact total, ordered newest first. The new housekeeping search, status filter, and counts apply only to those 50 loaded rows; the panel says so. Searching all inventory and hotel-wide status counts require server-side query support.
- `GET /api/staff/bookings?page=N` returns 50 bookings sorted by check-in, with no date, status, or text filters. There is no arrival/departure operations list endpoint. A useful addition should accept hotel-local date filters (`arrival_on`, `departure_on`), optional booking status and reference/guest/room search, apply filters before pagination, and return filtered `total` and `pageSize`. If the dashboard needs reliable day totals, return arrival and departure counts for the chosen hotel-local date in the same response (Africa/Mogadishu, as used by reports). Retain the existing `requireRole('admin', 'receptionist')` and session/RLS boundary.
- Do not make the browser fetch every booking page to calculate arrivals; that is unbounded and paginates before applying filters.
- Existing room status updates cover `available`, `cleaning`, and `maintenance`; there is no task assignment, room-cleaning completion timestamp, or staff audit history. If those are required, backend support should add assignment/actor/timestamp fields and an authenticated transition endpoint before the interface offers those actions.

## Not changed / outstanding

- No server API, database schema, auth, chain, or public frontend files were edited.
- No live database operations, staff account changes, deployment, or GitHub push were performed.
- No tests or build checks were run, per the active task instructions.
- The housekeeping filters are page-local until the rooms API gains server-side filtering/counts. Arrival/departure lists and assigned cleaning tasks remain blocked on the API support described above.
