// Read-only code verification; no secrets, network requests or local .env edits.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../../package.json', import.meta.url));
const ts = require('typescript');
function sourceModule(source) {
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
  return `data:text/javascript;base64,${Buffer.from(js).toString('base64')}`;
}
const root = new URL('../../', import.meta.url);
const originSource = fs.readFileSync(new URL('lib/site-origin.ts', root), 'utf8').replace('import "server-only";', '');
const originModule = sourceModule(originSource);
const { siteOrigin } = await import(originModule);
const httpSource = fs.readFileSync(new URL('lib/http.ts', root), 'utf8').replace('import "server-only";', '')
  .replace('import { siteOrigin } from "@/lib/site-origin";', `import { siteOrigin } from ${JSON.stringify(originModule)};`)
  .replace('import { AccessError } from "@/lib/auth/require-role";', 'class AccessError extends Error { constructor(status, message) { super(message); this.status = status; } }')
  .replace('import { logError } from "@/lib/log";', 'const logError = () => {};');
const { sameOrigin } = await import(sourceModule(httpSource));
process.env.NODE_ENV = 'production';
process.env.SITE_URL = 'https://nafiis-hotel.netlify.app/';
const origin = siteOrigin(new Headers());
assert.equal(origin, 'https://nafiis-hotel.netlify.app');
for (const suffix of ['/auth/callback', '/auth/callback?next=/guest', '/auth/callback?next=/reset-password']) {
  assert.equal(new URL(suffix, origin).href, origin + suffix);
}
sameOrigin(new Request(`${origin}/api/bookings/demo/payment`, { headers: { origin } }));
for (const bad of ['https://attacker.invalid', 'http://nafiis-hotel.netlify.app', 'http://127.0.0.1:4176']) {
  assert.throws(() => sameOrigin(new Request(`${origin}/api/bookings/demo/payment`, { headers: { origin: bad } })), error => error.status === 403);
}
process.stdout.write('PASS: trailing-slash SITE_URL normalizes to canonical HTTPS origin; callback/reset URLs have one slash; canonical upload origin accepted; other origins denied. No production settings or credentials changed by this check.\n');
