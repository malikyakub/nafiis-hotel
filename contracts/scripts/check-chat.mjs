// Run against local development; no model calls or hotel records are created.
import assert from "node:assert/strict";
const base = process.env.CHAT_TEST_ORIGIN || "http://127.0.0.1:4176";
const endpoint = `${base}/api/chat`;
const cases = [
  ["missing origin", {}, '{"message":"hello"}', 403],
  ["foreign origin", { Origin: "https://example.org" }, '{"message":"hello"}', 403],
  ["malformed JSON", { Origin: base }, "{", 400],
  ["empty question", { Origin: base }, '{"message":" "}', 400],
  ["non-text question", { Origin: base }, '{"message":{}}', 400],
  ["long question", { Origin: base }, JSON.stringify({ message: "a".repeat(1001) }), 400],
  ["oversized body", { Origin: base }, JSON.stringify({ message: "a".repeat(9000) }), 413],
];
for (const [name, headers, body, expected] of cases) {
  const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body });
  assert.equal(response.status, expected, name);
  assert.match(response.headers.get("cache-control"), /no-store/);
  console.log(`PASS ${name}`);
}
const oversizedStream = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode(JSON.stringify({ message: "a".repeat(9000) }))); controller.close(); } });
const streamed = await fetch(endpoint, { method: "POST", headers: { Origin: base, "Content-Type": "application/json" }, body: oversizedStream, duplex: "half" });
assert.equal(streamed.status, 413, "actual bytes bounded without content length");
const wrongType = await fetch(endpoint, { method: "POST", headers: { Origin: base, "Content-Type": "text/plain" }, body: "hello" });
assert.equal(wrongType.status, 415);
async function reset(cookie) {
  const response = await fetch(endpoint, { method: "DELETE", headers: { Origin: base, ...(cookie ? { Cookie: cookie } : {}) } });
  assert.equal(response.status, 200);
  const raw = response.headers.get("set-cookie");
  assert.match(raw, /HttpOnly/i); assert.match(raw, /SameSite=strict/i);
  const next = raw.split(";")[0];
  return { cookie: next, parts: decodeURIComponent(next.slice(next.indexOf("=") + 1)).split(".") };
}
const a = await reset(); const b = await reset(a.cookie); const c = await reset();
assert.equal(a.parts[0], b.parts[0], "new chat retains visitor limit identity");
assert.notEqual(a.parts[1], b.parts[1], "new chat rotates conversation");
assert.notEqual(a.parts[0], c.parts[0], "independent visitors isolated");
const forged = await reset(a.cookie.slice(0, -1) + (a.cookie.endsWith("0") ? "1" : "0"));
assert.notEqual(a.parts[0], forged.parts[0], "tampered cookie rejected");
console.log("PASS streamed size, content type, signed cookie, reset and visitor isolation");
