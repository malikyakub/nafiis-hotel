"use client";

import type { useAlert } from "./alert-provider";
import { Button } from "./button";

// Optional device storage of a guest's contact details, offered after booking, never before.
export type SavedContact = { full_name: string; phone: string; email: string };
type ShowAlert = ReturnType<typeof useAlert>;

const SAVED_CONTACT_KEY = "nafiis-saved-contact-v1";
// Hands the details just booked with from the booking bar to the payment page (this tab only).
const PENDING_CONTACT_KEY = "nafiis-pending-contact-v1";

const isContact = (value: unknown): value is SavedContact =>
  !!value && typeof value === "object" &&
  ["full_name", "phone", "email"].every((key) => typeof (value as Record<string, unknown>)[key] === "string");

export function readSavedContact(): SavedContact | null {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVED_CONTACT_KEY) || "null");
    return isContact(saved) ? { full_name: saved.full_name.slice(0, 120), phone: saved.phone.slice(0, 30), email: saved.email.slice(0, 254) } : null;
  } catch { return null; }
}

export function rememberDetails(showAlert: ShowAlert, values: SavedContact) {
  try {
    localStorage.setItem(SAVED_CONTACT_KEY, JSON.stringify({ full_name: values.full_name, phone: values.phone, email: values.email }));
    showAlert({ tag: "saved-contact", status: "success", durationMs: null, message: <><p>Details saved on this device for next time.</p>{forgetButton(showAlert)}</> });
  } catch {
    showAlert({ tag: "saved-contact", status: "warning", durationMs: null, message: "This browser could not save your details. Your booking is still saved." });
  }
}

function forgetDetails(showAlert: ShowAlert) {
  try {
    localStorage.removeItem(SAVED_CONTACT_KEY);
    showAlert({ tag: "saved-contact", status: "success", message: "Saved details removed from this device." });
  } catch {
    showAlert({ tag: "saved-contact", status: "warning", durationMs: null, message: "Unable to remove saved details. Use your browser's site-data settings." });
  }
}

export function forgetButton(showAlert: ShowAlert) {
  return <Button size="sm" variant="secondary" className="mt-2" onClick={() => forgetDetails(showAlert)}>Forget saved details</Button>;
}

export function stashPendingContact(bookingId: string, values: SavedContact) {
  try { sessionStorage.setItem(PENDING_CONTACT_KEY, JSON.stringify({ bookingId, ...values })); } catch { /* optional */ }
}

/** The details booked with in this tab, if this is the booking they were used for. */
export function readPendingContact(bookingId: string): SavedContact | null {
  try {
    const pending = JSON.parse(sessionStorage.getItem(PENDING_CONTACT_KEY) || "null");
    return pending?.bookingId === bookingId && isContact(pending) ? { full_name: pending.full_name, phone: pending.phone, email: pending.email } : null;
  } catch { return null; }
}

export function clearPendingContact() {
  try { sessionStorage.removeItem(PENDING_CONTACT_KEY); } catch { /* optional */ }
}
