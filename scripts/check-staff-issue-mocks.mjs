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
  // 1. Non-staff gets 403
  assert.equal(
    (await request('/staff/students/S10428', 'GET', undefined, 'S10428')).status,
    403,
  );

  // 2. Student places a hold on The Midnight Library (assigns WB-00421 -> HLD-1042)
  const holdRes = await request(
    '/holds',
    'POST',
    { bookId: 'book-midnight-library' },
    'S10428',
  );
  assert.equal(holdRes.status, 201);
  const heldCopyCode = holdRes.body.data.assignedCopy.copyCode;
  const holdCode = holdRes.body.data.holdCode;

  // 3. Staff looks up student S10428 (Maya Chen)
  const studentRes = await request('/staff/students/S10428');
  assert.equal(studentRes.status, 200);
  assert.equal(studentRes.body.data.student.accountId, 'S10428');
  assert.equal(studentRes.body.data.eligibility.isEligible, true);
  assert.equal(studentRes.body.data.eligibility.activeLoansCount, 2);
  assert.equal(studentRes.body.data.activeHolds.length, 1);
  assert.equal(studentRes.body.data.activeHolds[0].holdCode, holdCode);

  // 4. Check already borrowed copy WB-00423 -> canAdd: false
  const blockedCheck = await request(
    '/staff/copies/WB-00423/checkout-check?studentAccountId=S10428',
  );
  assert.equal(blockedCheck.status, 200);
  assert.equal(blockedCheck.body.data.canAdd, false);
  assert.equal(blockedCheck.body.data.blockingInfo.reasonCode, 'ALREADY_BORROWED');

  // 5. Check copy reserved for Maya (WB-00421) -> canAdd: true for Maya, false for Oliver (S10312)
  const reservedForMaya = await request(
    `/staff/copies/${heldCopyCode}/checkout-check?studentAccountId=S10428`,
  );
  assert.equal(reservedForMaya.status, 200);
  assert.equal(reservedForMaya.body.data.canAdd, true);
  assert.equal(reservedForMaya.body.data.associatedHold.holdCode, holdCode);

  const reservedForOther = await request(
    `/staff/copies/${heldCopyCode}/checkout-check?studentAccountId=S10312`,
  );
  assert.equal(reservedForOther.status, 200);
  assert.equal(reservedForOther.body.data.canAdd, false);
  assert.equal(
    reservedForOther.body.data.blockingInfo.reasonCode,
    'RESERVED_FOR_OTHER',
  );

  // 6. Check available copy WB-00511 -> canAdd: true
  const availCheck = await request(
    '/staff/copies/WB-00511/checkout-check?studentAccountId=S10428',
  );
  assert.equal(availCheck.status, 200);
  assert.equal(availCheck.body.data.canAdd, true);

  // 7. Duplicate copy in batch returns 400
  assert.equal(
    (
      await request('/staff/loans/issue', 'POST', {
        studentAccountId: 'S10428',
        items: [
          { copyCode: 'WB-00511', dueDate: '2026-10-29' },
          { copyCode: 'WB-00511', dueDate: '2026-10-29' },
        ],
      })
    ).status,
    400,
  );

  // 8. Ineligible student (S10312 has overdue loan) returns 403
  assert.equal(
    (
      await request('/staff/loans/issue', 'POST', {
        studentAccountId: 'S10312',
        items: [{ copyCode: 'WB-00511', dueDate: '2026-10-29' }],
      })
    ).status,
    403,
  );

  // 9. Issue 2 books (heldCopyCode + WB-00511) to S10428 -> 201 Created, fulfills hold
  const issueRes = await request('/staff/loans/issue', 'POST', {
    studentAccountId: 'S10428',
    items: [
      { copyCode: heldCopyCode, dueDate: '2026-10-29' },
      { copyCode: 'WB-00511', dueDate: '2026-10-29' },
    ],
  });
  assert.equal(issueRes.status, 201);
  assert.equal(issueRes.body.data.borrowEntries.length, 2);
  assert.equal(issueRes.body.data.fulfilledHolds.length, 1);
  assert.equal(issueRes.body.data.fulfilledHolds[0].holdCode, holdCode);
  assert.equal(issueRes.body.data.borrowerSummary.loansBefore, 2);
  assert.equal(issueRes.body.data.borrowerSummary.loansNow, 4);
  assert.equal(issueRes.body.data.borrowerSummary.remainingLoanSpace, 1);

  console.log(
    'PASS: staff student lookup, copy checkout-check (available, reserved, borrowed), batch issue, hold fulfillment, and error guards.',
  );
} finally {
  server.close();
}
