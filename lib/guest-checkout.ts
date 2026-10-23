import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const validId = /^[0-9a-f-]{36}$/i;
function signature(id: string, expires: string, browser: string) {
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Checkout service not configured.");
  return createHmac("sha256", secret).update(`guest-payment-v1:${id}:${expires}:${browser}`).digest("hex");
}
export async function allowGuestCheckout(id: string) {
  if (!validId.test(id)) throw new Error("Invalid booking.");
  const jar = await cookies();
  const browser = jar.get("nafiis-checkout")?.value;
  if (!browser) throw new Error("Checkout cookie unavailable.");
  const expires = String(Math.floor(Date.now() / 1000) + 7 * 86400);
  jar.set(`nafiis-booking-${id}`, `${expires}.${signature(id, expires, browser)}`, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 7 * 86400,
  });
}
export async function hasGuestCheckout(id: string) {
  if (!validId.test(id)) return false;
  const jar = await cookies();
  const browser = jar.get("nafiis-checkout")?.value;
  const value = jar.get(`nafiis-booking-${id}`)?.value;
  if (!browser || !value) return false;
  const [expires, mac, extra] = value.split(".");
  if (extra || !/^\d{10}$/.test(expires) || !/^[a-f0-9]{64}$/.test(mac || "") || Number(expires) <= Date.now()/1000) return false;
  try { return timingSafeEqual(Buffer.from(mac, "hex"), Buffer.from(signature(id, expires, browser), "hex")); }
  catch { return false; }
}
