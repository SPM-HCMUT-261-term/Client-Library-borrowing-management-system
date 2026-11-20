import { apiRequest } from './client';
import {
  ActiveLoanLookup,
  AddCopyRequestBody,
  AddCopyResult,
  AuthSession,
  Book,
  BookDetail,
  CancelHoldResult,
  CatalogResult,
  CopyCheckoutCheck,
  CreateBookRequestBody,
  FeaturedBookItem,
  GetBooksParams,
  GetStaffHoldsParams,
  GetStaffLoansParams,
  HoldConfirmation,
  IssueBooksRequestBody,
  IssueTransactionReceipt,
  LoginRequestBody,
  MyBorrowingDashboard,
  RenewLoanResult,
  ReturnBookRequestBody,
  ReturnDetail,
  StaffActiveHoldsPage,
  StaffLoanRecordsPage,
  StudentCheckoutProfile,
  UpdateBookRequestBody,
  UpdateCopyRequestBody,
  UpdateCopyResult,
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

export async function createBookApi(body: CreateBookRequestBody): Promise<Book> {
  const res = await apiRequest<Book>('/books', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return res.data;
}

export async function updateBookApi(
  id: string,
  body: UpdateBookRequestBody,
): Promise<Book> {
  const res = await apiRequest<Book>(`/books/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return res.data;
}

export async function deleteBookApi(
  id: string,
): Promise<{ message?: string }> {
  const res = await apiRequest<null>(`/books/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return { message: res.message };
}

// Route Group 3: Physical Copies (/copies & /books/:bookId/copies)
export async function addCopyToBookApi(
  bookId: string,
  body: AddCopyRequestBody,
): Promise<AddCopyResult> {
  const res = await apiRequest<AddCopyResult>(
    `/books/${encodeURIComponent(bookId)}/copies`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );
  return res.data;
}

export async function updateCopyApi(
  id: string,
  body: UpdateCopyRequestBody,
): Promise<UpdateCopyResult> {
  const res = await apiRequest<UpdateCopyResult>(
    `/copies/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      body: JSON.stringify(body),
    },
  );
  return res.data;
}

export async function deleteCopyApi(
  id: string,
): Promise<{ message?: string }> {
  const res = await apiRequest<null>(`/copies/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return { message: res.message };
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

// Route Group 5: Staff Counter & Loan Management (/staff)
export async function findStudentForCheckoutApi(
  accountId: string,
): Promise<StudentCheckoutProfile> {
  const res = await apiRequest<StudentCheckoutProfile>(
    `/staff/students/${encodeURIComponent(accountId.trim())}`,
    { method: 'GET' },
  );
  return res.data;
}

export async function checkCopyForCheckoutApi(
  copyCode: string,
  studentAccountId: string,
): Promise<CopyCheckoutCheck> {
  const query = new URLSearchParams({
    studentAccountId: studentAccountId.trim(),
  }).toString();
  const res = await apiRequest<CopyCheckoutCheck>(
    `/staff/copies/${encodeURIComponent(copyCode.trim())}/checkout-check?${query}`,
    { method: 'GET' },
  );
  return res.data;
}

export async function issueBooksApi(
  body: IssueBooksRequestBody,
): Promise<{ data: IssueTransactionReceipt; message?: string }> {
  return apiRequest<IssueTransactionReceipt>('/staff/loans/issue', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function findActiveLoanByCopyApi(
  copyCode: string,
): Promise<ActiveLoanLookup> {
  const res = await apiRequest<ActiveLoanLookup>(
    `/staff/loans/active-by-copy/${encodeURIComponent(copyCode.trim())}`,
    { method: 'GET' },
  );
  return res.data;
}

export async function returnBookApi(
  loanIdOrBorrowCode: string,
  body: ReturnBookRequestBody,
): Promise<{ data: ReturnDetail; message?: string }> {
  return apiRequest<ReturnDetail>(
    `/staff/loans/${encodeURIComponent(loanIdOrBorrowCode.trim())}/return`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );
}

export async function getStaffLoanRecordsApi(
  params: GetStaffLoansParams = {},
): Promise<StaffLoanRecordsPage> {
  const searchParams = new URLSearchParams();
  if (params.tab) searchParams.set('tab', params.tab);
  if (params.q) searchParams.set('q', params.q);
  if (params.status) searchParams.set('status', params.status);
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));

  const qs = searchParams.toString();
  const url = qs ? `/staff/loans?${qs}` : '/staff/loans';
  const res = await apiRequest<StaffLoanRecordsPage>(url, { method: 'GET' });
  return res.data;
}

export async function getStaffActiveHoldsApi(
  params: GetStaffHoldsParams = {},
): Promise<StaffActiveHoldsPage> {
  const searchParams = new URLSearchParams();
  if (params.q) searchParams.set('q', params.q);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));

  const qs = searchParams.toString();
  const url = qs ? `/staff/holds?${qs}` : '/staff/holds';
  const res = await apiRequest<StaffActiveHoldsPage>(url, { method: 'GET' });
  return res.data;
}
