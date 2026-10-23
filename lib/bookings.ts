import "server-only";
import { createHmac, randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { AccessError, requireRole } from "@/lib/auth/require-role";
import { allowGuestCheckout } from "@/lib/guest-checkout";
import { logError } from "@/lib/log";

/** Why an unpaid booking can no longer be paid. Mirrors refresh_booking_payment_state(). */
export type PaymentBlock = "expired" | "room_taken";
export const PAYMENT_BLOCK_MESSAGES: Record<PaymentBlock, string> = {
  expired: "Payment was not received within 24 hours, so this booking was cancelled. Do not send money for it. Please book again.",
  room_taken: "Another guest paid for this room first. Do not send money for this booking. Please choose another room or dates.",
};

/**
 * Lazily cancels an unpaid booking that is past its 24-hour deadline, or whose room was
 * taken by a submitted receipt. Call only after the caller is authorized for the booking.
 */
export async function refreshPaymentState(id: string) {
  const { data, error } = await createAdminClient().rpc("refresh_booking_payment_state", { p_booking: id });
  if (error) throw new Error("Booking state refresh failed.");
  return data as { status: string; code: PaymentBlock | null } | null;
}

/** Best effort: list views still treat past-deadline unpaid bookings as expired client-side. */
export async function expireUnpaidBookings() {
  try {
    const { error } = await createAdminClient().rpc("expire_unpaid_bookings");
    if (error) throw new Error("Unpaid booking expiry failed.");
  } catch (error) { logError("bookings.expire", error); }
}

export type BookingInput = {
  check_in: string; check_out: string; check_in_time: string; check_out_time: string;
  guests: string; room_type: string; full_name: string; phone: string; email: string;
};

export async function createBooking(values: BookingInput) {
  // The existing form validates first; database validation is authoritative.
  // Public checkout is always account-optional, even in a signed-in staff browser.
  // Customer history can link later using the customer's verified booking email.
  const admin = createAdminClient();
  const cookieStore = await cookies();
  let browserId = cookieStore.get("nafiis-checkout")?.value;
  if (!browserId || !/^[a-f0-9-]{36}$/.test(browserId)) {
    browserId = randomUUID();
    cookieStore.set("nafiis-checkout", browserId, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 7 * 86400,
    });
  }
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const digest = (text: string) => createHmac("sha256", key).update(text).digest("hex");
  const h = await headers();
  // Netlify overwrites this header. Other hosts use a shared fail-closed rate bucket
  // until a trusted platform-specific IP header is configured.
  const ip = process.env.NETLIFY === "true" ? h.get("x-nf-client-connection-ip") || "unknown" : "unknown";
  const { data, error } = await admin.rpc("create_checkout_booking", {
    p_request_key: digest(JSON.stringify([browserId, null, values])),
    p_requester_hash: digest(ip), p_customer: null,
    p_name: values.full_name, p_phone: values.phone, p_email: values.email,
    p_room_type: values.room_type, p_check_in: values.check_in, p_check_out: values.check_out,
    p_guests: Number(values.guests), p_arrival: values.check_in_time, p_departure: values.check_out_time,
  });
  if (error) {
    if (/No room is available|Too many booking requests|Customer account required|Invalid stay details/.test(error.message)) {
      throw new AccessError(400, error.message);
    }
    throw new Error("Booking could not be saved.");
  }
  const booking = data as { id: string; reference: string; status: string; total_amount: number };
  // Refresh the browser binding when an older one-day checkout cookie is present.
  cookieStore.set("nafiis-checkout", browserId, { httpOnly:true, secure:process.env.NODE_ENV === "production", sameSite:"lax", path:"/", maxAge:7*86400 });
  await allowGuestCheckout(booking.id);
  return booking;
}

export async function customerBookings(page = 1) {
  const { supabase, user } = await requireRole("guest");
  // Linking is performed by the server and only for a verified email address.
  const linkingConfigured = Boolean(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (linkingConfigured && user.email_confirmed_at && user.email) {
    const { error: linkError } = await createAdminClient().rpc("link_verified_bookings", {
      p_customer: user.id, p_verified_email: user.email,
    });
    if (linkError) throw new Error("Unable to link booking history.");
  }
  if (linkingConfigured) await expireUnpaidBookings();
  const { data, error, count } = await supabase.from("bookings")
    .select("id,reference,payment_expires_at,check_in,check_out,arrival_time,departure_time,guests_count,nightly_rate,total_amount,status,cancellation_reason,created_at,rooms(room_number,room_types(name)),payment_submissions(id,status,amount,reviewed_at,review_note),booking_proofs(transaction_hash,status)", { count: "exact" })
    .order("created_at", { ascending: false }).order("id").range((page - 1) * 50, page * 50 - 1);
  if (error) throw new Error("Unable to load bookings.");
  return { bookings: data, total: count || 0, page, pageSize: 50,
    notice: linkingConfigured ? null : "Bookings made while signed out cannot be linked yet. Contact reception if a booking is missing." };
}
