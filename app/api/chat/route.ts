import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { failure, json, sameOrigin } from "@/lib/http";
import { logError } from "@/lib/log";
import { quickAnswer } from "@/lib/chat/quick-answer";

export const runtime = "nodejs";
export const maxDuration = 90;
const COOKIE = "nafiis_chat";
const WINDOW = 10 * 60_000;
type Bucket = { count: number; expires: number; busy: boolean };
// Conservative single-process protection. A shared gateway must enforce fleet-wide limits.
const state = globalThis as typeof globalThis & { hotelChat?: { secret: string; buckets: Map<string, Bucket>; active: number; count: number; expires: number } };
const limits = state.hotelChat ??= { secret: randomBytes(32).toString("hex"), buckets: new Map(), active: 0, count: 0, expires: 0 };

function secret() {
  const value = process.env.HOTEL_CHAT_SESSION_SECRET;
  if (process.env.NODE_ENV === "production" && (!value || value.length < 32)) throw new Error("Chat session signing is not configured.");
  return value || limits.secret;
}
function signature(value: string) { return createHmac("sha256", secret()).update(value).digest("hex"); }
function session(request: NextRequest) {
  const raw = request.cookies.get(COOKIE)?.value || "";
  const [visitor, conversation, supplied] = raw.split(".");
  if (/^[a-f0-9-]{36}$/.test(visitor || "") && /^[a-f0-9-]{36}$/.test(conversation || "") && /^[a-f0-9]{64}$/.test(supplied || "")) {
    const expected = signature(`${visitor}.${conversation}`);
    if (timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))) return { visitor, conversation };
  }
  return { visitor: randomUUID(), conversation: randomUUID() };
}
function respond(data: unknown, current: ReturnType<typeof session>, status = 200) {
  const response = NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  const value = `${current.visitor}.${current.conversation}`;
  response.cookies.set(COOKIE, `${value}.${signature(value)}`, { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/api/chat", maxAge: 3600 });
  return response;
}
async function boundedText(body: ReadableStream<Uint8Array> | null, max: number) {
  if (!body) throw new Error("Missing body.");
  const reader = body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > max) { await reader.cancel().catch(() => {}); throw new RangeError("Body too large."); }
      chunks.push(value);
    }
    return Buffer.concat(chunks).toString("utf8");
  } finally { reader.releaseLock(); }
}

export async function DELETE(request: NextRequest) {
  try { sameOrigin(request); const current = session(request); return respond({ ok: true }, { ...current, conversation: randomUUID() }); }
  catch (error) { return failure("chat.reset", error); }
}

export async function POST(request: NextRequest) {
  let bucket: Bucket | undefined;
  try {
    sameOrigin(request);
    if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") || "")) return json({ error: "Send a JSON question." }, 415);
    if (Number(request.headers.get("content-length")) > 8192) return json({ error: "Your question is too long." }, 413);
    let body;
    try { body = JSON.parse(await boundedText(request.body, 8192)); }
    catch (error) { return json({ error: error instanceof RangeError ? "Your question is too long." : "Invalid question." }, error instanceof RangeError ? 413 : 400); }
    const message = body?.message;
    if (typeof message !== "string" || !message.trim() || message.length > 1000) return json({ error: "Enter a question of 1–1,000 characters." }, 400);
    const current = session(request);
    const now = Date.now();
    for (const [key, value] of limits.buckets) if (value.expires < now && !value.busy) limits.buckets.delete(key);
    if (limits.expires < now) { limits.count = 0; limits.expires = now + 60_000; }
    bucket = limits.buckets.get(current.visitor);
    if (bucket?.busy || (bucket && bucket.count >= 20) || limits.count >= 30 || (!bucket && limits.buckets.size >= 2000)) return respond({ error: "The assistant is busy. Please wait a minute before trying again." }, current, 429);
    bucket ??= { count: 0, expires: now + WINDOW, busy: false };
    limits.buckets.set(current.visitor, bucket);
    bucket.count++; bucket.busy = true; limits.count++;
    let inferenceActive = false;
    try {
      const answer = await quickAnswer(message.trim());
      if (answer) return respond(answer, current);
      if (limits.active >= 3) return respond({ error: "The assistant is busy. Please wait a minute before trying again." }, current, 429);
      const target = process.env.HOTEL_CHAT_WEBHOOK_URL;
      if (!target) return respond({ error: "AI replies are unavailable. You can still ask about room prices, the menu, location or how to book." }, current, 503);
      const endpoint = new URL(target);
      if (!(["http:", "https:"].includes(endpoint.protocol)) || endpoint.username || endpoint.password || (process.env.NODE_ENV === "production" && (endpoint.protocol !== "https:" || ["localhost", "127.0.0.1", "[::1]"].includes(endpoint.hostname)))) return respond({ error: "AI replies are unavailable. You can still ask about room prices, the menu, location or how to book." }, current, 503);
      limits.active++; inferenceActive = true;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      // Optional existing Basic Auth credential. Never expose it to the client.
      if (process.env.HOTEL_CHAT_BASIC_AUTH) headers.Authorization = `Basic ${Buffer.from(process.env.HOTEL_CHAT_BASIC_AUTH).toString("base64")}`;
      const upstream = await fetch(endpoint, { method: "POST", headers, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(80_000), body: JSON.stringify({ action: "sendMessage", sessionId: `hotel:${current.conversation}`, chatInput: message.trim() }) });
      if (!upstream.ok) { await upstream.body?.cancel(); throw new Error("Chat provider returned an unsuccessful status."); }
      const result = JSON.parse(await boundedText(upstream.body, 32_768));
      const item = Array.isArray(result) ? result[0] : result;
      const reply = item?.output ?? item?.text;
      if (typeof reply !== "string" || !reply.trim() || reply.length > 12000) throw new Error("Chat provider returned an invalid answer.");
      return respond({ reply, source: "ai" }, current);
    } catch {
      logError("chat.provider", new Error("Chat provider unavailable or returned an invalid response."));
      return respond({ error: "The assistant could not reply. Please try again or call reception." }, current, 502);
    } finally { bucket.busy = false; if (inferenceActive) limits.active--; }
  } catch (error) { return failure("chat.request", error); }
}
