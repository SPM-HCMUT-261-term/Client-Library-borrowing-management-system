import { apiRequest } from './client';
import {
  AdminUser,
  AdminUsersPage,
  GetAdminUsersParams,
  UpdateAdminUserBody,
} from '../types/api';

function normalizeAdminUser(user: AdminUser): AdminUser {
  return {
    ...user,
    _id: user._id ?? user.id ?? user.accountId,
  };
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
  const res = await apiRequest<AdminUser>(
    `/admin/users/${encodeURIComponent(id)}`,
    { method: 'GET' },
  );
  return normalizeAdminUser(res.data);
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
