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
async function request(path, method = 'GET', body, token = 'mock-jwt-ADM001') {
  const res = await fetch(`http://localhost/api/v1${path}`, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: res.status, body: await res.json() };
}
try {
  const body = { accountId: 'TEST001', fullName: 'Test Student', role: 'student', yearGroup: 'Year 10', password: 'initial-test' };
  assert.equal((await request('/admin/users', 'POST', body, 'mock-jwt-S10428')).status, 403);
  assert.equal((await request('/admin/users', 'POST', { ...body, fullName: '' })).status, 400);
  const created = await request('/admin/users', 'POST', body);
  assert.equal(created.status, 201); assert.equal(created.body.data.password, undefined);
  assert.equal((await request('/admin/users', 'POST', body)).status, 409);
  const update = await request('/admin/users/TEST001', 'PUT', { fullName: 'Updated Student', role: 'student', yearGroup: 'Year 12', status: 'Active' });
  assert.equal(update.body.data.fullName, 'Updated Student'); assert.equal(update.body.data.yearGroup, 'Year 12');
  assert.equal((await request('/admin/users/TEST001')).body.data.fullName, 'Updated Student');
  await request('/admin/users/TEST001', 'PUT', { fullName: 'Updated Student', role: 'student', yearGroup: null, status: 'Active' });
  assert.equal((await request('/admin/users/TEST001')).body.data.yearGroup, null);
  assert.equal((await request('/admin/users/TEST001/reset-password', 'POST', { newPassword: '' })).status, 400);
  assert.equal((await request('/admin/users/TEST001/reset-password', 'POST', { newPassword: 'changed-test' })).status, 200);
  assert.equal((await request('/auth/login', 'POST', { accountId: 'TEST001', password: 'initial-test', role: 'student' })).status, 401);
  assert.equal((await request('/auth/login', 'POST', { accountId: 'TEST001', password: 'changed-test', role: 'student' })).status, 200);
  assert.equal((await request('/admin/users/S10312', 'DELETE')).status, 409);
  const db = getMockDb();
  db.holds.push({ studentId: created.body.data._id }); saveMockDb(db);
  assert.equal((await request('/admin/users/TEST001', 'DELETE')).status, 409);
  db.holds = []; saveMockDb(db);
  assert.equal((await request('/admin/users/TEST001', 'DELETE')).status, 200);
  assert.equal((await request('/admin/users/TEST001')).status, 404);
  assert.equal((await request('/admin/users/TEST001/reset-password', 'POST', { newPassword: 'changed-test' })).status, 404);
  console.log('PASS: admin permissions, create, duplicate ID, edit name/year group, clear year group, reset + login, history/hold safeguards, delete and missing account.');
} finally { server.close(); }
