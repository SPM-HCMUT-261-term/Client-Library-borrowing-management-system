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
    if (url.endsWith('.ts') && url.includes('/src/'))
      return {
        format: 'module',
        shortCircuit: true,
        source: ts.transpileModule(readFileSync(fileURLToPath(url), 'utf8'), {
          compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2022,
          },
        }).outputText,
      };
    return next(url, context);
  },
});

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key),
};
globalThis.location = new URL('http://localhost');

const { handlers } = await import('../src/mocks/handlers.ts');
const server = setupServer(...handlers);
server.listen({ onUnhandledRequest: 'error' });

async function request(path, method = 'GET', body, sessionAccountId = 'STF001') {
  const res = await fetch(`http://localhost/api/v1${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Cookie: `bookborrow_mock_session=${sessionAccountId}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: res.status, body: await res.json() };
}

try {
  const newBookBody = {
    title: 'The Wild Robot',
    author: 'Peter Brown',
    isbn: '9781848127272',
    category: 'Fiction',
    keywords: ['Robots', 'nature', 'friendship'],
    publisher: 'Piccadilly Press',
  };

  // 1. Non-staff (student S10428) gets 403
  assert.equal(
    (await request('/books', 'POST', newBookBody, 'S10428')).status,
    403,
  );

  // 2. Staff creates book (starts with 0 copies)
  const createdBook = await request('/books', 'POST', newBookBody);
  assert.equal(createdBook.status, 201);
  assert.equal(createdBook.body.data.stockSummary.totalCopies, 0);
  const bookId = createdBook.body.data._id;

  // 3. Duplicate ISBN returns 409
  assert.equal((await request('/books', 'POST', newBookBody)).status, 409);

  // 4. Update book metadata
  const updatedBook = await request(`/books/${bookId}`, 'PUT', {
    ...newBookBody,
    title: 'The Wild Robot Escapes',
  });
  assert.equal(updatedBook.status, 200);
  assert.equal(updatedBook.body.data.title, 'The Wild Robot Escapes');

  // 5. Add physical copy
  const addedCopy = await request(`/books/${bookId}/copies`, 'POST', {
    copyCode: 'WB-00999',
    homeLocation: 'FIC BRO · B1',
    initialState: 'Available',
    condition: 'Good',
    notes: 'New paperback copy',
  });
  assert.equal(addedCopy.status, 201);
  assert.equal(addedCopy.body.data.updatedStockSummary.totalCopies, 1);
  assert.equal(addedCopy.body.data.updatedStockSummary.availableCopies, 1);
  const copyId = addedCopy.body.data.copy._id;

  // 6. Duplicate copyCode returns 409
  assert.equal(
    (
      await request(`/books/${bookId}/copies`, 'POST', {
        copyCode: 'WB-00999',
        homeLocation: 'FIC BRO · B1',
        initialState: 'Available',
        condition: 'Good',
      })
    ).status,
    409,
  );

  // 7. Deleting book while it still has a copy returns 409
  assert.equal((await request(`/books/${bookId}`, 'DELETE')).status, 409);

  // 8. Update physical copy state/condition
  const updatedCopy = await request(`/copies/${copyId}`, 'PUT', {
    homeLocation: 'FIC BRO · B2',
    state: 'Damaged',
    condition: 'Damaged',
    notes: 'Torn cover',
  });
  assert.equal(updatedCopy.status, 200);
  assert.equal(updatedCopy.body.data.updatedStockSummary.availableCopies, 0);
  assert.equal(updatedCopy.body.data.updatedStockSummary.damagedCopies, 1);

  // 9. Changing state of a Borrowed copy (WB-00423) returns 409
  assert.equal(
    (
      await request('/copies/WB-00423', 'PUT', {
        homeLocation: 'FIC HAI · A3',
        state: 'Available',
        condition: 'Good',
      })
    ).status,
    409,
  );

  // 10. Deleting a copy with loan history (WB-00422) returns 409
  assert.equal((await request('/copies/WB-00422', 'DELETE')).status, 409);

  // 11. Deleting new copy (no loan history) succeeds, then deleting book succeeds
  assert.equal((await request(`/copies/${copyId}`, 'DELETE')).status, 200);
  assert.equal((await request(`/books/${bookId}`, 'DELETE')).status, 200);

  console.log(
    'PASS: staff permissions, book create/edit/delete, copy add/edit/delete, derived stock updates, and 409 safeguards.',
  );
} finally {
  server.close();
}
