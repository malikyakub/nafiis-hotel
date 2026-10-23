import { createServerClient } from "@/lib/supabase/server";
import { failure, json } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams;
    const start = query.get("check_in") || "", end = query.get("check_out") || "";
    const valid = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
    const nights = (Date.parse(end) - Date.parse(start)) / 86400000;
    if (!valid(start) || !valid(end) || nights < 1 || nights > 60) return json({ error: "Choose a valid stay of 1 to 60 nights." }, 400);
    const supabase = await createServerClient();
    const { data, error } = await supabase.rpc("available_rooms", { p_check_in: start, p_check_out: end });
    if (error) throw new Error("Availability lookup failed.");
    return json({ rooms: data });
  } catch (error) { return failure("availability", error); }
}
