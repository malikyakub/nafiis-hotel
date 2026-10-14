// Isolated tests of the real routing/cache code; no database writes or network calls.
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const now = { value: 1_000_000 };
class Clock extends Date { static now() { return now.value; } }
function load(file, imports, extra = {}) {
  const exports = {};
  const js = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(js, { exports, require: name => { assert.ok(name in imports, `Unexpected import ${name}`); return imports[name]; }, Date: Clock, AbortSignal, ...extra });
  return exports;
}
const answers = load("lib/chat/answers.ts", {});
assert.equal(answers.classifyQuestion("What is my booking status?"), "private");
assert.equal(answers.classifyQuestion("Is an ocean room available?"), "availability");
assert.equal(answers.classifyQuestion("How do I pay?"), "payment");
assert.equal(answers.classifyQuestion("Explain Somali poetry"), null);
let reads = 0, fail = false, price = 75;
const query = { select(columns) { assert.equal(columns, "name,booking_code,base_price,capacity"); return this; }, eq(column, value) { assert.equal(column, "is_active"); assert.equal(value, true); return this; }, order() { return this; }, limit() { return this; }, async abortSignal() { reads++; return fail ? { error: { message: "unavailable" }, data: null } : { error: null, data: [{ name: "Garden room", booking_code: "garden", base_price: price, capacity: 2 }] }; } };
const quick = load("lib/chat/quick-answer.ts", {
  "server-only": {}, "./answers": answers,
  "@supabase/supabase-js": { createClient(url, key, options) { assert.equal(key, "public-anon"); assert.equal(options.auth.persistSession, false); return { from(table) { assert.equal(table, "room_types"); return query; } }; } },
  "@/lib/supabase/env": { supabasePublicEnv: () => ({ url: "https://example.invalid", anonKey: "public-anon" }) },
  "@/lib/brand": { brand: {} }, "@/lib/log": { logError() {} },
});
const [first, second] = await Promise.all([quick.quickAnswer("Room prices"), quick.quickAnswer("Room prices")]);
assert.equal(reads, 1, "concurrent requests share one read"); assert.match(first.reply, /\$75\.00/); assert.equal(first.reply, second.reply);
price = 80; await quick.quickAnswer("Room prices"); assert.equal(reads, 1, "public cache used within TTL");
now.value += 30_001;
const refreshed = await quick.quickAnswer("Room prices"); assert.equal(reads, 2); assert.match(refreshed.reply, /\$80\.00/);
now.value += 30_001; fail = true;
const failed = await quick.quickAnswer("Room prices"); assert.equal(failed.source, "hotel-guide"); assert.doesNotMatch(failed.reply, /\$80/); assert.match(failed.reply, /cannot read/i);
fail = false; const recovered = await quick.quickAnswer("Room prices"); assert.equal(recovered.source, "database"); assert.equal(reads, 4, "failure is not cached");
assert.equal(await quick.quickAnswer("Explain Somali poetry"), null);
console.log("PASS intent boundaries, public-only queries, cache coalescing, TTL refresh, failure and recovery");
