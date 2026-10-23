// Authorized live acceptance against the local preview. Creates one labelled
// confirmed guest with a random password, tests HTTP Server Actions and cleans
// up that account. No existing credentials, bookings or email sends are used.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { createClient } from '@supabase/supabase-js';

const require = createRequire(import.meta.url);
const { encodeReply } = require('next/dist/compiled/react-server-dom-webpack/client.node');
const origin = 'http://127.0.0.1:4176';
const preview = '../../.deployment/friday-preview-65b6646';
const statePath = '.chain-local/password-login-fixture.json';
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
let fixtureId, guestId, stage = 'preview form';
const jar = new Map();
function absorb(response) {
  for (const header of response.headers.getSetCookie()) {
    const [pair] = header.split(';');
    const at = pair.indexOf('=');
    const name = pair.slice(0, at), value = pair.slice(at + 1);
    if (/max-age=0/i.test(header) || !value) jar.delete(name); else jar.set(name, value);
  }
}
function cookie() { return [...jar].map(([key, value]) => `${key}=${value}`).join('; '); }
function actionId(name) {
  const manifest = JSON.parse(fs.readFileSync(`${preview}/.next/dev/server/server-reference-manifest.json`, 'utf8'));
  const match = Object.entries(manifest.node).find(([, entry]) => entry.exportedName === name);
  assert.ok(match, 'Action must be compiled');
  return match[0];
}
async function action(name, args) {
  const response = await fetch(`${origin}/login`, { method: 'POST', redirect: 'manual',
    headers: { origin, 'next-action': actionId(name), accept: 'text/x-component', cookie: cookie() },
    body: await encodeReply(args) });
  absorb(response);
  return response;
}
async function get(path) {
  const response = await fetch(`${origin}${path}`, { redirect: 'manual', headers: { cookie: cookie() } });
  absorb(response);
  return response;
}
const checked = result => { if (result.error) throw new Error('Fixture operation failed'); return result.data; };
try {
  assert.ok(!fs.existsSync(statePath), 'Prior fixture needs cleanup');
  const page = await get('/login'); const html = await page.text();
  assert.equal(page.status, 200);
  assert.match(html, /name="password"/);
  assert.doesNotMatch(html, /name="token"|one-time-code|Send verification code/);
  assert.match(html, /forgot-password/);
  stage = 'create guest fixture';
  const email = `nafiis-login-test-${crypto.randomUUID()}@example.invalid`;
  const password = crypto.randomBytes(30).toString('base64url');
  const user = checked(await admin.auth.admin.createUser({ email, password, email_confirm: true,
    user_metadata: { full_name: 'DEMO PASSWORD LOGIN TEST' } })).user;
  fixtureId = user.id;
  fs.mkdirSync('.chain-local', { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify({ id: fixtureId }));
  guestId = checked(await admin.from('guests').select('id').eq('profile_id', fixtureId).single()).id;
  const form = new FormData(); form.set('email', email); form.set('password', 'wrong-demo-password');
  stage = 'wrong password';
  let response = await action('login', [{}, form]);
  const failure = await response.text();
  assert.match(failure, /Email or password is incorrect/);
  assert.ok(![...jar.keys()].some(key => key.includes('auth-token')));
  form.set('password', password);
  stage = 'password sign-in';
  response = await action('login', [{}, form]);
  assert.ok(response.headers.get('x-action-redirect')?.startsWith('/guest'));
  await response.text();
  assert.ok([...jar.keys()].some(key => key.includes('auth-token')));
  stage = 'guest dashboard and staff denial';
  response = await get('/guest'); assert.equal(response.status, 200); await response.text();
  response = await get('/admin'); assert.equal(response.status, 307);
  assert.match(response.headers.get('location') || '', /\/login/);
  await response.text();
  stage = 'logout';
  response = await action('signOut', []);
  assert.ok(response.headers.get('x-action-redirect')?.startsWith('/login'));
  await response.text();
  assert.ok(![...jar.keys()].some(key => key.includes('auth-token')));
  response = await get('/guest'); assert.equal(response.status, 307);
  assert.match(response.headers.get('location') || '', /\/login/);
  await response.text();
  stage = 'disabled profile';
  checked(await admin.from('profiles').update({ is_active: false }).eq('id', fixtureId));
  response = await action('login', [{}, form]);
  assert.match(await response.text(), /This account is unavailable/);
  assert.ok(![...jar.keys()].some(key => key.includes('auth-token')));
  process.stdout.write('PASS: password form, wrong-password denial, guest sign-in/dashboard, staff-route denial, logout/cookie removal/protected-route denial, disabled-account denial. No OTP or email used.\n');
} catch {
  process.stderr.write(`Password login check failed at: ${stage}. No credentials or responses logged.\n`);
  process.exitCode = 1;
} finally {
  if (fixtureId) {
    let clean = true;
    for (const [table, column, id] of [['wallets', 'guest_id', guestId], ['guests', 'id', guestId], ['profiles', 'id', fixtureId]]) {
      if (id && (await admin.from(table).delete().eq(column, id)).error) clean = false;
    }
    if ((await admin.auth.admin.deleteUser(fixtureId)).error) clean = false;
    if (clean) { fs.unlinkSync(statePath); process.stdout.write('Temporary guest fixture removed.\n'); }
    else { process.stderr.write('Fixture cleanup incomplete; IDs retained locally.\n'); process.exitCode = 1; }
  }
}
