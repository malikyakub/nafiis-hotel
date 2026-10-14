// Display formatting shared by the portals and the payment page. Client and server safe.

/** "2026-10-20" → "20 Oct 2026". Noon avoids the date shifting across time zones. */
export function formatDate(day: string | null | undefined) {
  if (!day) return "—";
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(day) ? `${day}T12:00:00` : day);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** Timestamp → "20 Oct 2026, 14:05". */
export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatMoney(amount: unknown) {
  const n = Number(amount);
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : "—";
}

/** "pending_payment" → "Pending payment". */
export function humanize(value: string) {
  const text = value.replaceAll("_", " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Today in the hotel's time zone (Mogadishu, UTC+3), as yyyy-mm-dd. */
export function hotelToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Mogadishu" }).format(now);
}
