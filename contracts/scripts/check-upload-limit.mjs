// Local-only regression checks: no credentials, database, or network requests.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../../lib/bounded-form-data.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } });
const { boundedFormData, FormBodyError } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`);
const boundary = 'nafiis-test';
const contentType = `multipart/form-data; boundary=${boundary}`;
const body = new TextEncoder().encode(`--${boundary}\r\nContent-Disposition: form-data; name="reference"\r\n\r\nDEMO\r\n--${boundary}--\r\n`);
const make = (bytes, headers = {}) => new Request('https://example.invalid/payment', { method: 'POST', headers: { 'content-type': contentType, ...headers }, body: bytes });
const rejects = (request, limit, status) => assert.rejects(boundedFormData(request, limit), error => error instanceof FormBodyError && error.status === status);

assert.equal((await boundedFormData(make(body), body.length)).get('reference'), 'DEMO');
await rejects(make(body), body.length - 1, 413);
await rejects(make(body, { 'content-length': '1' }), body.length - 1, 413);
await rejects(make(body, { 'content-length': String(body.length + 1) }), body.length, 413);
await rejects(make(body, { 'content-type': 'application/json' }), body.length, 415);
await rejects(make(new TextEncoder().encode('broken multipart')), body.length, 400);

let cancelled = false;
const stream = new ReadableStream({
  pull(controller) { controller.enqueue(new Uint8Array(32)); },
  cancel() { cancelled = true; },
});
await rejects(new Request('https://example.invalid/payment', { method: 'POST', headers: { 'content-type': contentType }, body: stream, duplex: 'half' }), 64, 413);
assert.equal(cancelled, true, 'Oversized streams must be cancelled');
process.stdout.write('PASS: exact boundary, absent/false/oversized Content-Length, unsupported type, malformed form, and stream cancellation.\n');
