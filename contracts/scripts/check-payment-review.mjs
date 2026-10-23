// Route-level checks with explicit dependency doubles. These do not replace
// staff-browser/RLS acceptance and do not touch live payments or blockchain.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const state = { denied: false, originDenied: false, rpcError: false, calls: [], anchors: [], roles: [] };
globalThis.__nafiisReviewTest = {
  async requireRole(...roles) {
    state.roles = roles;
    if (state.denied) throw new Error('Forbidden');
    return { user: { id: 'test-staff' }, supabase: { from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: { booking_id: 'test-booking' } }) }) }) }) } };
  },
  createAdminClient: () => ({ rpc: async (name, args) => { state.calls.push({ name, args }); return { error: state.rpcError ? new Error('stale') : null }; } }),
  sameOrigin: () => { if (state.originDenied) throw new Error('Forbidden'); },
  json: (data, status = 200) => Response.json(data, { status }),
  failure: () => Response.json({ error: 'Denied' }, { status: 403 }),
  anchorBooking: async id => { state.anchors.push(id); return { status: 'pending' }; },
};
try {
  let source = await readFile(new URL('../../app/api/admin/payments/[id]/route.ts', import.meta.url), 'utf8');
  const imports = [
    ['requireRole', '@/lib/auth/require-role'], ['createAdminClient', '@/lib/supabase/admin'],
    ['failure, json, sameOrigin', '@/lib/http'], ['anchorBooking', '@/lib/chain/booking-proof'],
  ];
  for (const [names, path] of imports) {
    const line = `import { ${names} } from "${path}";`;
    assert.ok(source.includes(line));
    source = source.replace(line, `const { ${names} } = globalThis.__nafiisReviewTest;`);
  }
  const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } });
  const { PATCH } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`);
  const run = body => PATCH(new Request('https://example.invalid/review', { method: 'PATCH', body: JSON.stringify(body) }), { params: Promise.resolve({ id: '11111111-1111-4111-8111-111111111111' }) });
  const rejected = { decision: 'rejected', note: '  DEMO receipt does not match  ' };
  state.originDenied = true;
  assert.equal((await run(rejected)).status, 403);
  state.originDenied = false;
  state.denied = true;
  assert.equal((await run(rejected)).status, 403);
  assert.equal(state.calls.length, 0);
  state.denied = false;
  for (const body of [null, [], 'invalid', false, 42, { decision: 'rejected', note: ' ' }, { decision: 'invalid', note: 'x' }, { decision: 'approved', note: 'x'.repeat(1001) }]) {
    assert.equal((await run(body)).status, 400);
  }
  assert.equal(state.calls.length, 0);
  assert.equal((await run(rejected)).status, 200);
  assert.deepEqual(state.roles, ['admin']);
  assert.equal(state.calls.at(-1).name, 'review_booking_payment');
  assert.equal(state.calls.at(-1).args.p_note, rejected.note.trim());
  assert.equal(state.calls.at(-1).args.p_admin, 'test-staff');
  assert.equal(state.anchors.length, 0);
  state.rpcError = true;
  assert.equal((await run({ decision: 'approved', note: '' })).status, 409);
  assert.equal(state.anchors.length, 0);
  state.rpcError = false;
  assert.equal((await run({ decision: 'approved', note: '' })).status, 200);
  assert.deepEqual(state.anchors, ['test-booking']);
  process.stdout.write('PASS: origin/session denial, administrator-only role requirement, review validation, rejection without chain call, stale review conflict, approval chain dispatch. Dependency doubles only.\n');
} finally { delete globalThis.__nafiisReviewTest; }
