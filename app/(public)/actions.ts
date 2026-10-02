"use server";

import type { FormState } from "@/lib/auth/form-state";
import { brand } from "@/lib/brand";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s-]{7,20}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const ROOM_TYPES = new Set(["any", "ocean", "garden", "family"]);
const MAX_GUESTS = 6;
const MAX_NIGHTS = 60;

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

const DAY_MS = 24 * 60 * 60 * 1000;

// Quick booking from the home page. Guests book without an account; saving their details
// (account + wallet) is offered after the booking, never required.
export async function requestBooking(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = {
    check_in: text(formData, "check_in"),
    check_in_time: text(formData, "check_in_time"),
    check_out: text(formData, "check_out"),
    check_out_time: text(formData, "check_out_time"),
    guests: text(formData, "guests"),
    room_type: text(formData, "room_type"),
    full_name: text(formData, "full_name"),
    phone: text(formData, "phone"),
    email: text(formData, "email").toLowerCase(),
  };

  if (!DATE_RE.test(values.check_in) || !DATE_RE.test(values.check_out)) {
    return { error: "Choose your check-in and check-out dates.", values };
  }
  if (!TIME_RE.test(values.check_in_time) || !TIME_RE.test(values.check_out_time)) {
    return { error: "Choose your check-in and check-out times.", values };
  }
  const checkIn = Date.parse(`${values.check_in}T00:00:00Z`);
  const checkOut = Date.parse(`${values.check_out}T00:00:00Z`);
  // Allow yesterday (UTC) so a guest's "today" in Mogadishu (UTC+3) is never rejected.
  if (Number.isNaN(checkIn) || checkIn < Date.now() - 2 * DAY_MS) {
    return { error: "Check-in can't be in the past.", values };
  }
  const nights = Math.round((checkOut - checkIn) / DAY_MS);
  if (Number.isNaN(nights) || nights < 1) return { error: "Check-out must be after check-in.", values };
  if (nights > MAX_NIGHTS) return { error: `For stays over ${MAX_NIGHTS} nights, call reception.`, values };

  const guests = Number(values.guests);
  if (!Number.isInteger(guests) || guests < 1 || guests > MAX_GUESTS) {
    return { error: `Choose between 1 and ${MAX_GUESTS} guests.`, values };
  }
  if (!ROOM_TYPES.has(values.room_type)) return { error: "Choose a room type.", values };

  if (values.full_name.length < 2) return { error: "Enter the name the booking is under.", values };
  if (!PHONE_RE.test(values.phone)) return { error: "Enter a phone number we can reach you on.", values };
  if (values.email && !EMAIL_RE.test(values.email)) return { error: "Check the email address.", values };

  // TODO(booking): create the booking here. Blocked on the schema: bookings belong to a signed-up
  // guest today (guests.profile_id), so guest checkout needs a DB change from the DB agent first.
  // Until then nothing is stored, and the guest is told so instead of being shown a fake confirmation.
  return {
    error: `Online booking opens soon. To book these dates now, call reception on ${brand.contact.phone}.`,
    values,
  };
}
