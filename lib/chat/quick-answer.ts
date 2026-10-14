import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabasePublicEnv } from "@/lib/supabase/env";
import { brand } from "@/lib/brand";
import { logError } from "@/lib/log";
import { classifyQuestion, roomAnswer, menuAnswer, type RoomRow, type MenuRow } from "./answers";

type Reply = { reply: string; source: "database" | "hotel-guide" };
// Fixed keys, public rows only. Never cache a caller's session or account data.
type Cached = { value?: unknown; expires: number; pending?: Promise<unknown> };
const state = globalThis as typeof globalThis & { hotelChatPublicCache?: Map<string, Cached> };
const cache = state.hotelChatPublicCache ??= new Map<string, Cached>();
async function publicData<T>(key: "rooms" | "menu" | "settings", read: () => Promise<T>): Promise<T> {
  const current = cache.get(key);
  if (current?.value !== undefined && current.expires > Date.now()) return current.value as T;
  if (current?.pending) return current.pending as Promise<T>;
  const entry: Cached = { expires: 0 };
  entry.pending = read().then(value => { cache.set(key, { value, expires: Date.now() + 30_000 }); return value; }).catch(error => { cache.delete(key); throw error; });
  cache.set(key, entry);
  return entry.pending as Promise<T>;
}

function database() {
  const { url, anonKey } = supabasePublicEnv();
  // Anonymous client even for signed-in staff: public RLS, never service-role privileges.
  return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

export async function quickAnswer(question: string): Promise<Reply | null> {
  const intent = classifyQuestion(question);
  if (!intent) return null;
  const guide = (reply: string): Reply => ({ reply, source: "hotel-guide" });
  switch (intent) {
    case "greeting": return guide("Welcome to Nafiis! Ask me about room prices, guest capacity, the menu, our location, or how to book and pay.");
    case "private": return guide("For your booking or payment status, sign in and open your own bookings, or use your private checkout link. Reception can help if you booked without an account. I cannot access personal booking, payment or identity records in chat.");
    case "booking": return guide("Choose Book a room on the homepage, select your dates, room type and guest details, then continue to payment. An account is optional. A request becomes confirmed only after staff review; I cannot reserve or confirm a room in chat.");
    case "payment": return guide("After submitting a booking request, open its payment screen for the current EVC Plus or eDahab instructions and upload your receipt there. Staff review payment before confirming the booking. Blockchain proof is handled by authorized staff; do not send cryptocurrency, wallet keys or payment proofs in chat.");
    case "policy": return guide("Please contact reception to confirm check-in/check-out times, early arrival, cancellation or refund terms for your stay. I do not have approved policy details to quote here.");
    case "amenities": return guide("The hotel website lists Wi-Fi, air conditioning, daily housekeeping and room service. Airport pickup is available on request; reception can confirm arrangements and any charges.");
    case "availability": return guide("Use Book a room and select your dates and guest count to check live availability and the final price. A room-price listing in chat does not guarantee a room is available, and I cannot hold or confirm it here.");
  }
  try {
    if (intent === "rooms") {
      const rows = await publicData<RoomRow[]>("rooms", async () => {
        const { data, error } = await database().from("room_types").select("name,booking_code,base_price,capacity").eq("is_active", true).order("base_price").limit(30).abortSignal(AbortSignal.timeout(4000));
        if (error) throw new Error("Public room lookup failed.");
        return data || [];
      });
      return { reply: roomAnswer(rows, question), source: "database" };
    }
    if (intent === "menu") {
      const rows = await publicData<MenuRow[]>("menu", async () => {
        const { data, error } = await database().from("food_menu").select("name,category,price").eq("is_available", true).order("category").order("name").limit(100).abortSignal(AbortSignal.timeout(4000));
        if (error) throw new Error("Public menu lookup failed.");
        return data || [];
      });
      return { reply: menuAnswer(rows, question), source: "database" };
    }
    const settings = await publicData<{ name: string; address: string | null; phone: string | null; email: string | null } | null>("settings", async () => {
      const { data, error } = await database().from("hotel_settings").select("name,address,phone,email").limit(1).abortSignal(AbortSignal.timeout(4000));
      if (error) throw new Error("Public hotel details lookup failed.");
      return data?.[0] || null;
    });
    if (intent === "location") {
      if (settings?.address?.trim()) return { reply: `${settings.name || brand.name} is located at ${settings.address}. Use Contact and directions on the website for more details.`, source: "database" };
      return guide(`${brand.name} Hotel is on ${brand.contact.street}, ${brand.contact.district}, ${brand.city}, ${brand.contact.country}.`);
    }
    return { reply: `Contact reception at ${settings?.phone?.trim() || brand.contact.phone}, or email ${settings?.email?.trim() || brand.contact.email}.`, source: settings?.phone?.trim() && settings?.email?.trim() ? "database" : "hotel-guide" };
  } catch {
    logError("chat.public-data", new Error("Public hotel information unavailable."));
    // Never invent a price, use stale data, or wait for slow inference on a failed lookup.
    return guide("I cannot read the latest hotel information right now. Please check Rooms or Dining on the website, or contact reception. I cannot quote a current price until the database is available.");
  }
}
