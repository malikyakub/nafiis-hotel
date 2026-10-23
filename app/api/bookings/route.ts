import { customerBookings } from "@/lib/bookings";
import { failure, json } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const page = Number(new URL(request.url).searchParams.get("page") || 1);
    if (!Number.isSafeInteger(page) || page < 1 || page > 100000) return json({ error: "Invalid page." }, 400);
    return json(await customerBookings(page));
  } catch (error) { return failure("bookings.list", error); }
}
