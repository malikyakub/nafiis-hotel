// Local regression tests with an in-memory Next.js cookie store. No real keys,
// sessions, database access, or HTTP requests are used.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

async function moduleSource(path, replacements = []) {
  let source = await readFile(new URL(`../../${path}`, import.meta.url), 'utf8');
  source = source.replace('import "server-only";', '');
  for (const [from, to] of replacements) {
    assert.ok(source.includes(from), `Missing expected import: ${from}`);
    source = source.replace(from, to);
  }
  const result = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } });
  return `data:text/javascript;base64,${Buffer.from(result.outputText).toString('base64')}`;
}

const saved = Object.fromEntries(['NODE_ENV', 'SITE_URL', 'SUPABASE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY'].map(k => [k, process.env[k]]));
const values = new Map();
let lastOptions;
globalThis.__nafiisSecurityTestCookies = {
  get: key => values.has(key) ? { value: values.get(key) } : undefined,
  set: (key, value, options) => { values.set(key, value); lastOptions = options; },
};
try {
  const originUrl = await moduleSource('lib/site-origin.ts');
  const { siteOrigin } = await import(originUrl);
  const httpUrl = await moduleSource('lib/http.ts', [
    ['import { siteOrigin } from "@/lib/site-origin";', `import { siteOrigin } from ${JSON.stringify(originUrl)};`],
    ['import { AccessError } from "@/lib/auth/require-role";', 'class AccessError extends Error { constructor(status, message) { super(message); this.status = status; } }'],
    ['import { logError } from "@/lib/log";', 'const logError = () => {};'],
  ]);
  const { sameOrigin } = await import(httpUrl);
  const request = (origin, extra = {}) => new Request('http://127.0.0.1:4176/payment', {
    headers: { host: '127.0.0.1:4176', ...(origin === undefined ? {} : { origin }), ...extra },
  });
  const denied = req => assert.throws(() => sameOrigin(req), error => error.status === 403);
  process.env.NODE_ENV = 'development';
  delete process.env.SITE_URL;
  sameOrigin(request('http://127.0.0.1:4176'));
  sameOrigin(request('http://localhost:4176'));
  denied(request('http://localhost:4177'));
  denied(request('https://localhost:4176'));
  denied(request(undefined));
  denied(request('null'));
  denied(request('https://attacker.invalid'));
  denied(request('http://127.0.0.1:4176', { 'sec-fetch-site': 'cross-site' }));
  assert.throws(() => siteOrigin(new Headers({ host: 'attacker.invalid' })));
  process.env.NODE_ENV = 'production';
  assert.throws(() => siteOrigin(new Headers({ host: '127.0.0.1:4176' })));
  process.env.SITE_URL = 'https://hotel.example';
  sameOrigin(request('https://hotel.example'));
  denied(request('http://127.0.0.1:4176'));
  denied(request('https://attacker.invalid', { 'x-forwarded-host': 'attacker.invalid' }));
  for (const bad of ['http://hotel.example', 'https://hotel.example/path', 'https://user:pass@hotel.example', 'https://hotel.example?query=1', 'https://hotel.example/#fragment']) {
    process.env.SITE_URL = bad;
    assert.throws(() => siteOrigin(new Headers()));
  }

  const guestUrl = await moduleSource('lib/guest-checkout.ts', [
    ['import { cookies } from "next/headers";', 'const cookies = async () => globalThis.__nafiisSecurityTestCookies;'],
  ]);
  const { allowGuestCheckout, hasGuestCheckout } = await import(guestUrl);
  process.env.SUPABASE_SECRET_KEY = 'LOCAL-TEST-ONLY-NOT-A-REAL-KEY';
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  const id = '11111111-1111-4111-8111-111111111111';
  const other = '22222222-2222-4222-8222-222222222222';
  const key = `nafiis-booking-${id}`;
  assert.equal(await hasGuestCheckout(id), false);
  await assert.rejects(allowGuestCheckout(id));
  values.set('nafiis-checkout', 'test-browser-a');
  await allowGuestCheckout(id);
  const valid = values.get(key);
  assert.equal(await hasGuestCheckout(id), true);
  assert.equal(lastOptions.httpOnly, true);
  assert.equal(lastOptions.secure, true);
  assert.equal(lastOptions.sameSite, 'lax');
  assert.equal(lastOptions.maxAge, 604800);
  values.set('nafiis-checkout', 'test-browser-b');
  assert.equal(await hasGuestCheckout(id), false);
  values.set('nafiis-checkout', 'test-browser-a');
  values.set(`nafiis-booking-${other}`, valid);
  assert.equal(await hasGuestCheckout(other), false);
  for (const bad of ['broken', `${valid}.extra`, `1000000000.${valid.split('.')[1]}`, `${valid.slice(0, -1)}${valid.endsWith('0') ? '1' : '0'}`]) {
    values.set(key, bad);
    assert.equal(await hasGuestCheckout(id), false);
  }
  values.set(key, valid);
  delete process.env.SUPABASE_SECRET_KEY;
  assert.equal(await hasGuestCheckout(id), false);
  assert.equal(await hasGuestCheckout('invalid'), false);
  process.stdout.write('PASS: origin restrictions, production URL validation, private booking cookie flags, browser/booking binding, tampering and missing-secret denial.\n');
} finally {
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
  delete globalThis.__nafiisSecurityTestCookies;
}
