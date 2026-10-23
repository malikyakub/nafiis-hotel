/** Back to the booking form with the guest's dates, explaining that another guest paid first. */
export function roomTakenHref(stay: { check_in?: string; check_out?: string }) {
  const query = new URLSearchParams({ notice: "room_taken" });
  if (stay.check_in && stay.check_out) { query.set("check_in", stay.check_in); query.set("check_out", stay.check_out); }
  return `/?${query}#book`;
}
