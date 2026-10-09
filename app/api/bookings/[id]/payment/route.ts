import { randomUUID } from "node:crypto";
import { boundedFormData, FormBodyError } from "@/lib/bounded-form-data";
import { MAX_RECEIPT_BYTES, MAX_RECEIPT_REQUEST_BYTES } from "@/lib/upload-limits";
import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { failure, json, sameOrigin } from "@/lib/http";
import { hasGuestCheckout } from "@/lib/guest-checkout";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    sameOrigin(request);
    const { id } = await context.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "Invalid booking ID." }, 400);
    const anonymous = await hasGuestCheckout(id);
    const session = anonymous ? null : await requireRole("guest");
    const admin = createAdminClient();
    const supabase = session?.supabase || admin;
    const { data: booking, error } = await supabase.from("bookings").select("id,status,hold_expires_at").eq("id", id).maybeSingle();
    if (error || !booking) return json({ error: "Booking unavailable." }, 404);
    if (booking.status !== "pending_payment") return json({ error: "This booking is not awaiting payment." }, 409);
    if (!booking.hold_expires_at || Date.parse(booking.hold_expires_at) <= Date.now()) return json({error:"Payment window expired. Do not send money. Create a new booking first."},409);
    const form = await boundedFormData(request, MAX_RECEIPT_REQUEST_BYTES);
    const file = form.get("proof");
    if (!(file instanceof File) || !file.size || file.size > MAX_RECEIPT_BYTES) return json({ error: "Choose a PNG, JPEG or PDF under 4 MB." }, 400);
    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? "png" : bytes[0]===255&&bytes[1]===216&&bytes[2]===255 ? "jpg" : bytes.subarray(0,5).toString()==="%PDF-" ? "pdf" : null;
    if (!ext) return json({ error: "Only PNG, JPEG and PDF attachments are accepted." }, 400);
    const path = `${anonymous ? "guest" : session!.user.id}/${id}/${randomUUID()}.${ext}`;
    const { error: uploadError } = await admin.storage.from("payment-proofs").upload(path, bytes, { contentType: ext==="jpg"?"image/jpeg":ext==="png"?"image/png":"application/pdf", upsert:false });
    if (uploadError) throw new Error("Payment attachment upload failed.");
    const { data, error: submitError } = await admin.rpc(anonymous ? "submit_guest_booking_payment" : "submit_booking_payment", {
      p_booking:id, ...(!anonymous ? { p_customer:session!.user.id } : {}), p_object:path, p_reference:String(form.get("reference")||"").slice(0,120),
    });
    if (submitError) {
      await admin.storage.from("payment-proofs").remove([path]);
      return json({ error: "Payment could not be submitted. Refresh the booking; its availability may have changed." }, 409);
    }
    return json({ paymentId:data, status:"submitted" },201);
  } catch(error) {
    if (error instanceof FormBodyError) return json({ error: error.message }, error.status);
    return failure("payment.submit",error);
  }
}
