import { ArrowRight, BedDouble, CreditCard, LogIn, LogOut } from "lucide-react";
import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { guestName, roomLabel, stayLabel, type Booking } from "@/lib/booking-display";
import { expireUnpaidBookings } from "@/lib/bookings";
import { formatDateTime, formatMoney, hotelToday } from "@/lib/format";
import { StatusBadge } from "./badge";
import { Card } from "./card";
import { Table, TableFrame, TableMessage, Td, Th } from "./table";

const BOOKING_FIELDS = "id,reference,created_at,payment_expires_at,check_in,check_out,status,total_amount,guests_count,rooms(room_number,room_types(name)),guests(booking_name,booking_phone,profiles(full_name,phone))";

function Stat({ label, value, detail, icon: Icon, href }: { label: string; value: string; detail: string; icon: typeof LogIn; href: string }) {
  return (
    <Link href={href} className="group rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
      <Card className="flex h-full flex-col gap-3 p-5 transition group-hover:border-border-strong">
        <span className="flex items-center justify-between text-sm text-muted">
          {label}
          <span className="flex size-9 items-center justify-center rounded-full bg-brand/10 text-brand"><Icon aria-hidden className="size-[18px]" /></span>
        </span>
        <span className="font-display text-[36px] leading-[40px]">{value}</span>
        <span className="text-xs text-muted">{detail}</span>
      </Card>
    </Link>
  );
}

function BookingList({ title, rows, empty, href, columns }: { title: string; rows: Booking[]; empty: string; href: string; columns: "stay" | "recent" }) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-[22px] leading-7">{title}</h2>
        <Link href={href} className="inline-flex items-center gap-1 text-sm text-brand hover:underline">View all<ArrowRight aria-hidden className="size-4" /></Link>
      </div>
      <TableFrame className="max-h-none">
        <Table caption={title}>
          <thead>
            <tr><Th>Reference</Th><Th>Guest</Th><Th>Room</Th>{columns === "recent" ? <><Th>Stay</Th><Th>Booked</Th><Th className="text-right">Total</Th></> : null}<Th>Status</Th></tr>
          </thead>
          <tbody>
            {rows.length === 0 ? <TableMessage colSpan={columns === "recent" ? 7 : 4}>{empty}</TableMessage> : rows.map((b) => (
              <tr key={b.id}>
                <Td><span className="font-mono text-[13px]">{b.reference}</span></Td>
                <Td>{guestName(b)}</Td>
                <Td>{roomLabel(b)}</Td>
                {columns === "recent" && <>
                  <Td><span className="whitespace-nowrap">{stayLabel(b)}</span></Td>
                  <Td><span className="whitespace-nowrap">{formatDateTime(b.created_at)}</span></Td>
                  <Td className="text-right">{formatMoney(b.total_amount)}</Td>
                </>}
                <Td><StatusBadge value={b.status} /></Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableFrame>
    </section>
  );
}

// Today at a glance for administrator and reception. Read-only; data comes through row-level security.
export async function PortalOverview({ role }: { role: "admin" | "receptionist" }) {
  const { supabase } = await requireRole(role);
  await expireUnpaidBookings();
  const today = hotelToday();
  const [arrivals, departures, pending, rooms, occupied, recent] = await Promise.all([
    supabase.from("bookings").select(BOOKING_FIELDS, { count: "exact" }).eq("check_in", today).neq("status", "cancelled").order("check_in").limit(8),
    supabase.from("bookings").select(BOOKING_FIELDS, { count: "exact" }).eq("check_out", today).in("status", ["confirmed", "checked_in"]).order("check_out").limit(8),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "payment_submitted"),
    supabase.from("rooms").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("bookings").select("id", { count: "exact", head: true }).in("status", ["confirmed", "checked_in"]).lte("check_in", today).gt("check_out", today),
    supabase.from("bookings").select(BOOKING_FIELDS).order("created_at", { ascending: false }).limit(8),
  ]);
  const base = role === "admin" ? "/admin" : "/reception";
  const bookingsHref = role === "admin" ? "/admin/bookings" : "/reception/bookings";
  const paymentsHref = role === "admin" ? "/admin/payments/queue" : "/reception/payments";
  const roomCount = rooms.count ?? 0;
  const occupiedCount = occupied.count ?? 0;
  const occupancy = roomCount ? Math.round((occupiedCount / roomCount) * 100) : 0;
  const failed = [arrivals, departures, pending, rooms, occupied, recent].some((r) => r.error);

  return (
    <div className="flex flex-col gap-8">
      {failed && <p className="text-sm text-danger">Some figures could not be loaded. Refresh to try again.</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Arrivals today" value={String(arrivals.count ?? 0)} detail="Checking in today, not cancelled" icon={LogIn} href={bookingsHref} />
        <Stat label="Departures today" value={String(departures.count ?? 0)} detail="Checking out today" icon={LogOut} href={bookingsHref} />
        <Stat label="Payments to review" value={String(pending.count ?? 0)} detail="Receipts waiting for the administrator" icon={CreditCard} href={paymentsHref} />
        <Stat label="Occupancy tonight" value={`${occupancy}%`} detail={`${occupiedCount} of ${roomCount} active rooms`} icon={BedDouble} href={`${base}/rooms`} />
      </div>
      <div className="grid gap-8 xl:grid-cols-2">
        <BookingList title="Today's arrivals" rows={(arrivals.data ?? []) as Booking[]} empty="No arrivals today." href={bookingsHref} columns="stay" />
        <BookingList title="Today's departures" rows={(departures.data ?? []) as Booking[]} empty="No departures today." href={bookingsHref} columns="stay" />
      </div>
      <BookingList title="Recent bookings" rows={(recent.data ?? []) as Booking[]} empty="No bookings yet." href={bookingsHref} columns="recent" />
    </div>
  );
}
