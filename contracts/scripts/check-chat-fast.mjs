// Live read-only checks. Run with node --env-file=.env.local contracts/scripts/check-chat-fast.mjs.
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
const base = process.env.CHAT_TEST_ORIGIN || "http://127.0.0.1:4176";
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: rooms, error } = await db.from("room_types").select("name,base_price,capacity").eq("is_active", true);
assert.equal(error, null);
const samples = [];
for (const [message, source] of [["Room prices", "database"], ["How much is the family suite?", "database"], ["Restaurant menu", "database"], ["Where is the hotel?", "database"], ["How do I book?", "hotel-guide"], ["How do payments work?", "hotel-guide"], ["What is my booking status?", "hotel-guide"], ["Are rooms available tomorrow?", "hotel-guide"]]) {
  const started = performance.now();
  const response = await fetch(`${base}/api/chat`, { method: "POST", headers: { Origin: base, "Content-Type": "application/json" }, body: JSON.stringify({ message }) });
  const data = await response.json();
  const ms = Math.round(performance.now() - started);
  assert.equal(response.status, 200, message); assert.equal(data.source, source, message);
  if (message === "Room prices") for (const room of rooms) {
    assert.ok(data.reply.includes(room.name));
    assert.ok(data.reply.includes(new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(Number(room.base_price))));
    assert.ok(data.reply.includes(`up to ${room.capacity} guests`));
  }
  if (message.includes("family suite")) { assert.match(data.reply, /Family suite/); assert.doesNotMatch(data.reply, /Garden room:/); }
  if (message.includes("booking status")) assert.match(data.reply, /cannot access personal/i);
  if (message.includes("available tomorrow")) assert.match(data.reply, /select your dates/i);
  assert.doesNotMatch(data.reply, /hotel_chat|service_role|wallet_private_key|room_id|room_number/i);
  samples.push({ message, source, milliseconds: ms });
  console.log(`PASS ${source} ${ms}ms: ${message}`);
}
console.log(`Direct answers: ${Math.min(...samples.map(s => s.milliseconds))}–${Math.max(...samples.map(s => s.milliseconds))}ms; no AI inference used.`);
