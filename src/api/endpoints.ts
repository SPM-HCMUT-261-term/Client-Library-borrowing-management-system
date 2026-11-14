import { apiRequest } from './client';
import {
  AuthSession,
  BookDetail,
  CancelHoldResult,
  CatalogResult,
  FeaturedBookItem,
  GetBooksParams,
  HoldConfirmation,
  LoginRequestBody,
  MyBorrowingDashboard,
  RenewLoanResult,
  User,
} from '../types/api';

// Route Group 1: Auth (/auth)
export async function loginApi(body: LoginRequestBody): Promise<AuthSession> {
  const res = await apiRequest<AuthSession>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return res.data;
}

export async function getMeApi(): Promise<User> {
  const res = await apiRequest<User & { id?: string }>('/auth/me', {
    method: 'GET',
  });
  return {
    ...res.data,
    _id: res.data._id ?? res.data.id ?? '',
  };
}

export async function logoutApi(): Promise<{ message?: string }> {
  const res = await apiRequest<null>('/auth/logout', {
    method: 'POST',
  });
  return { message: res.message };
}

// Route Group 2: Books & Catalog (/books)
export async function getFeaturedBooksApi(
  limit = 4,
): Promise<FeaturedBookItem[]> {
  const res = await apiRequest<FeaturedBookItem[]>(
    `/books/featured?limit=${limit}`,
    { method: 'GET' },
  );
  return res.data;
}

export async function getBooksApi(
  params: GetBooksParams = {},
): Promise<CatalogResult> {
  const searchParams = new URLSearchParams();
  if (params.q) searchParams.set('q', params.q);
  if (params.category) searchParams.set('category', params.category);
  if (params.genre) searchParams.set('genre', params.genre);
  if (params.language) searchParams.set('language', params.language);
  if (params.availableNow !== undefined) {
    searchParams.set('availableNow', String(params.availableNow));
  }
  if (params.stock) searchParams.set('stock', params.stock);
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));

  const queryString = searchParams.toString();
  const url = queryString ? `/books?${queryString}` : '/books';

  const res = await apiRequest<CatalogResult>(url, { method: 'GET' });
  return res.data;
}

export async function getBookByIdApi(id: string): Promise<BookDetail> {
  const res = await apiRequest<BookDetail>(
    `/books/${encodeURIComponent(id)}`,
    { method: 'GET' },
  );
  return res.data;
}

// Route Group 4: Student Borrowing, Hold & Renewal (/me, /holds, /loans)
export async function getMyBorrowingApi(): Promise<MyBorrowingDashboard> {
  const res = await apiRequest<MyBorrowingDashboard>('/me/borrowing', {
    method: 'GET',
  });
  return res.data;
}

export async function createHoldApi(bookId: string): Promise<HoldConfirmation> {
  const res = await apiRequest<HoldConfirmation>('/holds', {
    method: 'POST',
    body: JSON.stringify({ bookId }),
  });
  return res.data;
}

export async function cancelHoldApi(
  holdIdOrCode: string,
): Promise<{ data: CancelHoldResult; message?: string }> {
  return apiRequest<CancelHoldResult>(
    `/holds/${encodeURIComponent(holdIdOrCode)}`,
    { method: 'DELETE' },
  );
}

export async function renewLoanApi(
  loanIdOrCode: string,
): Promise<{ data: RenewLoanResult; message?: string }> {
  return apiRequest<RenewLoanResult>(
    `/loans/${encodeURIComponent(loanIdOrCode)}/renew`,
    { method: 'POST' },
  );
}
