// Booking fields as shown in the portals. Server and client safe.
import { formatDate } from "@/lib/format";
import { one, type Relation } from "@/lib/portal-api";

export type ChainProof = { transaction_hash: string; status: "pending" | "confirmed" | "failed" };
export type Booking = {
  id: string; reference: string; created_at?: string; payment_expires_at: string; check_in: string; check_out: string;
  status: string; total_amount: number; guests_count: number; cancellation_reason?: string | null;
  rooms?: Relation<{ room_number: string; room_types?: Relation<{ name: string }> }>;
  guests?: Relation<{ booking_name: string | null; booking_phone: string | null; profiles: Relation<{ full_name: string; phone: string }> }>;
  payment_submissions?: Relation<{ id: string; status: string; amount?: number; review_note: string | null }>;
  booking_proofs?: Relation<ChainProof>;
};
export const guestName = (booking: Booking) => {
  const guest = one(booking.guests);
  return one(guest?.profiles)?.full_name || guest?.booking_name || "—";
};
export const guestPhone = (booking: Booking) => {
  const guest = one(booking.guests);
  return one(guest?.profiles)?.phone || guest?.booking_phone || "";
};
export const roomLabel = (booking: Booking) => {
  const room = one(booking.rooms);
  if (!room) return "Awaiting assignment";
  const type = one(room.room_types)?.name;
  return type ? `${room.room_number} · ${type}` : room.room_number;
};
export const stayLabel = (booking: { check_in: string; check_out: string }) => `${formatDate(booking.check_in)} – ${formatDate(booking.check_out)}`;

