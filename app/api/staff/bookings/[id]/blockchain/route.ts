import { anchorBooking } from "@/lib/chain/booking-proof";
import { failure, json, sameOrigin } from "@/lib/http";

export const runtime = "nodejs";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    sameOrigin(request);
    const { id } = await context.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "Invalid booking." }, 400);
    return json(await anchorBooking(id));
  } catch (error) { return failure("booking.chain.route", error); }
}
