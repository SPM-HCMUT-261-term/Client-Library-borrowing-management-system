import { delay, http, HttpResponse } from 'msw';
import { getMockDb, saveMockDb, MockUserRecord } from './db';
import { CreateAdminUserBody, UpdateAdminUserBody } from '../types/api';

const base = '/api/v1/admin/users';
function allowed(request: Request) {
  const token = request.headers.get('Authorization') || '';
  const accountId = token.replace('Bearer mock-jwt-', '');
  return getMockDb().users.some(u => u.accountId === accountId && u.role === 'admin' && u.status === 'Active');
}
function failure(status: number, code: string, message: string) {
  return HttpResponse.json({ success: false, error: { code, message } }, { status });
}
function publicUser(user: MockUserRecord) {
  const { password: _password, ...data } = user;
  return data;
}
export const adminHandlers = [
  http.post(base, async ({ request }) => {
    await delay(140);
    if (!allowed(request)) return failure(403, 'FORBIDDEN_ACCESS', 'Admin access required.');
    const body = await request.json() as CreateAdminUserBody;
    if (typeof body.accountId !== 'string' || !body.accountId.trim() || typeof body.fullName !== 'string' || !/^[a-zA-ZÀ-ỹ\s]+$/.test(body.fullName.trim()) || typeof body.password !== 'string' || !body.password || !['student', 'staff', 'admin'].includes(body.role) || (body.yearGroup != null && typeof body.yearGroup !== 'string')) {
      return failure(400, 'BAD_REQUEST', 'Enter a valid account ID, full name, role and password.');
    }
    const db = getMockDb();
    const accountId = body.accountId.trim();
    if (db.users.some(u => u.accountId === accountId)) return failure(409, 'DUPLICATE_ACCOUNT_ID', 'Account ID already exists.');
    const now = new Date().toISOString();
    const user: MockUserRecord = {
      _id: crypto.randomUUID(), accountId, fullName: body.fullName.trim(), password: body.password,
      initials: body.fullName.trim().split(/\s+/).slice(0, 2).map(s => s[0]).join('').toUpperCase(),
      role: body.role, status: 'Active', yearGroup: body.yearGroup?.trim() || null,
      activeLoansCount: 0, overdueLoansCount: 0, unpaidFines: 0, maxLoansLimit: 5,
      hasBorrowingHistory: false, createdAt: now, updatedAt: now,
    };
    db.users.push(user); saveMockDb(db);
    return HttpResponse.json({ success: true, data: publicUser(user) }, { status: 201 });
  }),
  http.post(`${base}/:id/reset-password`, async ({ request, params }) => {
    await delay(140);
    if (!allowed(request)) return failure(403, 'FORBIDDEN_ACCESS', 'Admin access required.');
    const body = await request.json() as { newPassword?: unknown };
    if (typeof body.newPassword !== 'string' || !body.newPassword) return failure(400, 'BAD_REQUEST', 'New password is required.');
    const db = getMockDb();
    const id = String(params.id).toLowerCase();
    const user = db.users.find(u => u._id.toLowerCase() === id || u.accountId.toLowerCase() === id);
    if (!user) return failure(404, 'USER_NOT_FOUND', 'User not found.');
    user.password = body.newPassword; user.updatedAt = new Date().toISOString(); saveMockDb(db);
    return HttpResponse.json({ success: true, message: `Password reset successfully for account ${user.accountId}.` });
  }),
  http.delete(`${base}/:id`, async ({ request, params }) => {
    await delay(140);
    if (!allowed(request)) return failure(403, 'FORBIDDEN_ACCESS', 'Admin access required.');
    const db = getMockDb();
    const id = String(params.id).toLowerCase();
    const user = db.users.find(u => u._id.toLowerCase() === id || u.accountId.toLowerCase() === id);
    if (!user) return failure(404, 'USER_NOT_FOUND', 'User not found.');
    if (user.hasBorrowingHistory || db.loans.some(l => l.studentId === user._id) || db.holds.some(h => h.studentId === user._id)) return failure(409, 'USER_HAS_LOAN_HISTORY', 'Cannot delete user with borrowing or reservation history.');
    db.users = db.users.filter(u => u._id !== user._id); saveMockDb(db);
    return HttpResponse.json({ success: true, message: 'User account deleted successfully.' });
  }),
  http.get(base, async ({ request }) => {
    await delay(120);
    if (!allowed(request)) return failure(403, 'FORBIDDEN_ACCESS', 'Admin access required.');
    const query = new URL(request.url).searchParams;
    const q = (query.get('q') || '').trim().toLowerCase();
    const role = query.get('role');
    const status = query.get('status');
    const page = Math.max(1, Number(query.get('page')) || 1);
    const limit = Math.max(1, Number(query.get('limit')) || 10);
    const items = getMockDb().users.filter(u => (!q || u.fullName.toLowerCase().includes(q) || u.accountId.toLowerCase().includes(q)) && (!role || role === 'all' || u.role === role) && (!status || status === 'all' || u.status === status));
    return HttpResponse.json({ success: true, data: { items: items.slice((page - 1) * limit, page * limit).map(publicUser), pagination: { totalItems: items.length, currentPage: page, totalPages: Math.ceil(items.length / limit), limit } } });
  }),
  http.get(`${base}/:id`, async ({ request, params }) => {
    await delay(100);
    if (!allowed(request)) return failure(403, 'FORBIDDEN_ACCESS', 'Admin access required.');
    const id = String(params.id).toLowerCase();
    const user = getMockDb().users.find(u => u._id.toLowerCase() === id || u.accountId.toLowerCase() === id);
    return user ? HttpResponse.json({ success: true, data: publicUser(user) }) : failure(404, 'USER_NOT_FOUND', 'User not found.');
  }),
  http.put(`${base}/:id`, async ({ request, params }) => {
    await delay(140);
    if (!allowed(request)) return failure(403, 'FORBIDDEN_ACCESS', 'Admin access required.');
    const body = await request.json() as UpdateAdminUserBody;
    const db = getMockDb();
    const id = String(params.id).toLowerCase();
    const user = db.users.find(u => u._id.toLowerCase() === id || u.accountId.toLowerCase() === id);
    if (!user) return failure(404, 'USER_NOT_FOUND', 'User not found.');
    Object.assign(user, { fullName: body.fullName, role: body.role, status: body.status, yearGroup: body.yearGroup ?? null, updatedAt: new Date().toISOString() });
    user.initials = body.fullName.trim().split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase();
    saveMockDb(db);
    return HttpResponse.json({ success: true, data: publicUser(user) });
  }),
];
