// Node 22.15+; runs against in-memory storage only, never the backend database.
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { setupServer } from 'msw/node';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && context.parentURL?.includes('/src/')) {
      const url = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(url)) return { url: url.href, shortCircuit: true };
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.endsWith('.ts') && url.includes('/src/')) return {
      format: 'module', shortCircuit: true,
      source: ts.transpileModule(readFileSync(fileURLToPath(url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText,
    };
    return next(url, context);
  },
});
const storage = new Map();
globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
globalThis.location = new URL('http://localhost');
const { handlers } = await import('../src/mocks/handlers.ts');
const { getMockDb, saveMockDb } = await import('../src/mocks/db.ts');
const server = setupServer(...handlers);
server.listen({ onUnhandledRequest: 'error' });
async function request(path, method = 'GET', body, sessionAccountId = 'ADM001') {
  const res = await fetch(`http://localhost/api/v1${path}`, { method, headers: { 'Content-Type': 'application/json', Cookie: `bookborrow_mock_session=${sessionAccountId}` }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: res.status, body: await res.json() };
}
try {
  const { formatCollectionDeadline } = await import('../src/utils/borrowingDates.ts');
  assert.equal(formatCollectionDeadline('2026-11-18T08:30:00Z').time, '3:30 pm');
  assert.equal(formatCollectionDeadline('2026-11-18').time, '');
  assert.equal(formatCollectionDeadline('invalid').time, '');
  const dashboard = await request('/me/borrowing', 'GET', undefined, 'S10428');
  assert.equal((await request('/me/borrowing', 'GET', undefined, '')).status, 401);
  assert.equal(dashboard.status, 200);
  assert.equal(dashboard.body.data.currentLoans.length, 2);
  const loan = dashboard.body.data.currentLoans.find(l => l.canRenew);
  assert.ok(loan);
  assert.equal((await request('/loans/' + loan.borrowCode + '/renew', 'POST', undefined, 'S10312')).status, 404);
  const renewed = await request('/loans/' + loan.borrowCode + '/renew', 'POST', undefined, 'S10428');
  assert.equal(renewed.status, 200);
  const afterRenew = (await request('/me/borrowing', 'GET', undefined, 'S10428')).body.data;
  assert.equal(afterRenew.currentLoans.find(l => l._id === loan._id).canRenew, false);
  assert.equal(afterRenew.currentLoans.find(l => l._id === loan._id).dueDate, renewed.body.data.newDueDate);
  assert.notEqual((await request('/loans/' + loan.borrowCode + '/renew', 'POST', undefined, 'S10428')).status, 200);
  const hold = await request('/holds', 'POST', {bookId: 'book-midnight-library'}, 'S10428');
  assert.equal(hold.status, 201);
  const held = (await request('/me/borrowing', 'GET', undefined, 'S10428')).body.data;
  assert.equal(held.holdRequests.length, 1);
  assert.equal(held.holdRequests[0].collectBy, hold.body.data.collectBy);
  assert.equal((await request('/holds/' + held.holdRequests[0].holdCode, 'DELETE', undefined, 'S10312')).status, 404);
  assert.equal((await request('/holds/' + held.holdRequests[0].holdCode, 'DELETE', undefined, 'S10428')).status, 200);
  assert.equal((await request('/me/borrowing', 'GET', undefined, 'S10428')).body.data.holdRequests.length, 0);
  const blocked = (await request('/me/borrowing', 'GET', undefined, 'S10312')).body.data;
  assert.equal(blocked.accountSummary.canBorrow, false);
  assert.ok(blocked.currentLoans.some(l => l.isOverdue && !l.canRenew));
  console.log('PASS: borrowing dashboard, renewal refresh/repeat rejection, hold deadline, cancellation, overdue state and date formatting.');
} finally { server.close(); }
