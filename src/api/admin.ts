import { apiRequest, ApiClientError } from './client';
import {
  AdminUser,
  AdminUsersPage,
  GetAdminUsersParams,
  UpdateAdminUserBody,
  CreateAdminUserBody,
} from '../types/api';

function normalizeAdminUser(user: AdminUser): AdminUser {
  return {
    ...user,
    _id: user._id ?? user.id ?? user.accountId,
  };
}

export async function createAdminUserApi(body: CreateAdminUserBody): Promise<AdminUser> {
  const res = await apiRequest<AdminUser>('/admin/users', { method: 'POST', body: JSON.stringify(body) });
  return normalizeAdminUser(res.data);
}

export async function resetAdminUserPasswordApi(id: string, newPassword: string): Promise<void> {
  await apiRequest<void>(`/admin/users/${encodeURIComponent(id)}/reset-password`, {
    method: 'POST', body: JSON.stringify({ newPassword }),
  });
}

export async function deleteAdminUserApi(id: string): Promise<void> {
  await apiRequest<void>(`/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function getAdminUsersApi(
  params: GetAdminUsersParams = {},
): Promise<AdminUsersPage> {
  const searchParams = new URLSearchParams();
  if (params.q?.trim()) searchParams.set('q', params.q.trim());
  if (params.role && params.role !== 'all') searchParams.set('role', params.role);
  if (params.status && params.status !== 'all') {
    searchParams.set('status', params.status);
  }
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));

  const query = searchParams.toString();
  const res = await apiRequest<AdminUsersPage>(
    `/admin/users${query ? `?${query}` : ''}`,
    { method: 'GET' },
  );
  return {
    ...res.data,
    items: res.data.items.map(normalizeAdminUser),
  };
}

export async function getAdminUserApi(id: string): Promise<AdminUser> {
  // Backend only exposes GET /admin/users (list/search), not GET /admin/users/:id.
  // Query with q=id and match exact accountId or _id so it works with both MSW and the real backend.
  const page = await getAdminUsersApi({ q: id, limit: 50 });
  const target = id.trim().toLowerCase();
  const match = page.items.find(
    (u) =>
      u.accountId.toLowerCase() === target ||
      u._id.toLowerCase() === target ||
      u.id?.toLowerCase() === target,
  );
  if (!match) {
    throw new ApiClientError(404, 'USER_NOT_FOUND', 'User not found.');
  }
  return match;
}

export async function updateAdminUserApi(
  id: string,
  body: UpdateAdminUserBody,
): Promise<AdminUser> {
  const res = await apiRequest<AdminUser>(
    `/admin/users/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      body: JSON.stringify(body),
    },
  );
  return normalizeAdminUser(res.data);
}
