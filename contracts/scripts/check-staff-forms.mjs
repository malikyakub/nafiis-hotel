// Invalid-body regression for staff APIs; all auth/DB dependencies are doubles.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
let databaseCalls = 0;
const db = new Proxy({}, { get() { databaseCalls++; throw new Error('Unexpected DB operation'); } });
globalThis.__nafiisFormsTest = {
  requireRole: async () => ({ supabase: db, user: { id: 'test-staff' } }),
  sameOrigin: () => {},
  json: (body, status = 200) => Response.json(body, { status }),
  failure: (_context, error) => Response.json({ error: 'Invalid request' }, { status: error instanceof SyntaxError ? 400 : 500 }),
};
try {
  for (const [path, method] of [
    ['app/api/admin/receptionists/route.ts', 'POST'],
    ['app/api/staff/reservations/route.ts', 'POST'],
    ['app/api/staff/bookings/[id]/route.ts', 'PATCH'],
  ]) {
    let source = await readFile(new URL(`../../${path}`, import.meta.url), 'utf8');
    source = source.replace(/import\s*\{([^}]+)\}\s*from\s*"@\/lib\/(?:http|auth\/require-role)";/g,
      (_match, names) => `const {${names}} = globalThis.__nafiisFormsTest;`);
    const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } });
    const route = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`);
    for (const body of ['null', '[]', 'false', '42', '"invalid"', '{', '']) {
      const response = await route[method](new Request('https://example.invalid/form', { method, body }), {
        params: Promise.resolve({ id: '11111111-1111-4111-8111-111111111111' }),
      });
      assert.equal(response.status, 400, `${path}: ${body}`);
    }
  }
  assert.equal(databaseCalls, 0);
  process.stdout.write('PASS: staff reservation, booking update and receptionist forms reject null/array/scalar/malformed/empty bodies before database operations.\n');
} finally { delete globalThis.__nafiisFormsTest; }
