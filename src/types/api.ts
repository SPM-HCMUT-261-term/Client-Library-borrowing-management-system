// Core Enums & Constants matching docs/API_Contract.md Section 1.4
export type UserRole = 'student' | 'staff' | 'admin';
export type UserStatus = 'Active' | 'Inactive';
export type BookCategory =
  | 'Fiction'
  | 'Non-fiction'
  | 'Poetry'
  | 'Graphic novels'
  | 'Reference';
export type BookLanguage = 'English' | 'Vietnamese';
export type CopyState = 'Available' | 'Borrowed' | 'Reserved' | 'Damaged' | 'Lost';
export type CopyCondition = 'Good' | 'Damaged' | 'Lost';
export type HoldStatus = 'Ready' | 'Fulfilled' | 'Cancelled' | 'Expired';
export type LoanStatus = 'Active' | 'Returned';

export const BUSINESS_CONSTANTS = {
  MAX_LOANS_PER_STUDENT: 5,
  DEFAULT_LOAN_DAYS: 14,
  RENEWAL_EXTRA_DAYS: 7,
  MAX_RENEWALS_PER_LOAN: 1,
} as const;

// Section 1.3 Standard Response Envelope
export interface ApiSuccessResponse<T> {
  success: true;
  message?: string;
  data: T;
}

export interface ApiErrorObject {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorObject;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Section 2.1 User Object
export interface User {
  _id: string;
  accountId: string;
  fullName: string;
  initials: string;
  role: UserRole;
  status: UserStatus;
  yearGroup: string | null;
  activeLoansCount: number;
  maxLoansLimit: number;
  overdueLoansCount: number;
  unpaidFines: number;
  hasBorrowingHistory: boolean;
  createdAt: string;
  updatedAt: string;
}

// Section 2.2 Book & StockSummary
export interface StockSummary {
  totalCopies: number;
  availableCopies: number;
  borrowedCopies: number;
  reservedCopies: number;
  damagedCopies: number;
  lostCopies: number;
  isAvailableNow: boolean;
}

export interface Book {
  _id: string;
  title: string;
  author: string;
  isbn: string;
  category: BookCategory;
  genre: string | null;
  keywords: string[];
  publisher: string | null;
  publishedYear: number | null;
  language: BookLanguage;
  format: string;
  pageCount: number | null;
  description: string | null;
  coverImageUrl: string | null;
  shelfReference: string | null;
  sectionName: string | null;
  stockSummary: StockSummary;
  createdAt: string;
  updatedAt: string;
}

// Section 2.3 PhysicalCopy Object
export interface PhysicalCopy {
  _id: string;
  copyCode: string;
  bookId: string;
  homeLocation: string;
  state: CopyState;
  condition: CopyCondition;
  notes: string | null;
  hasLoanHistory: boolean;
  createdAt: string;
  updatedAt: string;
}

// Section 3: Auth Route (/auth)
export interface LoginRequestBody {
  accountId: string;
  password: string;
  role: UserRole;
}

export interface AuthSessionUser {
  _id: string;
  accountId: string;
  fullName: string;
  initials: string;
  role: UserRole;
  status: UserStatus;
  yearGroup: string | null;
  activeLoansCount: number;
  maxLoansLimit: number;
}

export interface AuthSession {
  accessToken?: string;
  user: AuthSessionUser;
}

export interface AdminUser extends User {
  id?: string;
}

export interface AdminUsersPage {
  items: AdminUser[];
  pagination: PaginationInfo;
}

export interface GetAdminUsersParams {
  q?: string;
  role?: 'all' | UserRole;
  status?: 'all' | UserStatus;
  page?: number;
  limit?: number;
}

export interface UpdateAdminUserBody {
  fullName: string;
  role: UserRole;
  yearGroup?: string | null;
  status: UserStatus;
}

// Section 4.1: GET /books/featured
export interface FeaturedBookItem {
  _id: string;
  title: string;
  author: string;
  category: BookCategory;
  genre: string | null;
  coverImageUrl: string | null;
  shelfReference: string | null;
  stockSummary: {
    totalCopies: number;
    availableCopies: number;
    isAvailableNow: boolean;
  };
}

// Section 4.2: GET /books
export interface GetBooksParams {
  q?: string;
  category?: string;
  genre?: string;
  language?: string;
  availableNow?: boolean;
  stock?: 'all' | 'available' | 'unavailable';
  sortBy?: 'relevance' | 'title' | 'publishedYear';
  page?: number;
  limit?: number;
}

export interface CatalogBookItem {
  _id: string;
  title: string;
  author: string;
  isbn: string;
  category: BookCategory;
  genre: string | null;
  language: BookLanguage;
  publisher: string | null;
  keywords: string[];
  coverImageUrl: string | null;
  shelfReference: string | null;
  stockSummary: {
    totalCopies: number;
    availableCopies: number;
    borrowedCopies: number;
    reservedCopies: number;
    isAvailableNow: boolean;
  };
}

export interface PaginationInfo {
  totalItems: number;
  currentPage: number;
  totalPages: number;
  limit: number;
}

export interface CatalogResult {
  items: CatalogBookItem[];
  pagination: PaginationInfo;
}

// Section 4.3: GET /books/:id
export interface BookDetailCopy {
  _id: string;
  copyCode: string;
  homeLocation: string;
  state: CopyState;
  condition: CopyCondition;
  displayLocation: string;
  activeLoan: {
    borrowCode: string;
    studentName: string;
    studentAccountId: string;
    dueDate: string;
  } | null;
  activeHold: {
    holdCode: string;
    studentName: string;
    studentAccountId: string;
    collectBy: string;
  } | null;
  hasLoanHistory: boolean;
}

export interface ViewerContext {
  canBorrow: boolean;
  canRequestHold: boolean;
  blockReason: string | null;
  activeLoansCount: number;
  maxLoansLimit: number;
  existingHoldCode: string | null;
}

export interface BookDetail {
  _id: string;
  title: string;
  author: string;
  isbn: string;
  category: BookCategory;
  genre: string | null;
  keywords: string[];
  description: string | null;
  publisher: string | null;
  publishedYear: number | null;
  format: string;
  language: BookLanguage;
  pageCount: number | null;
  coverImageUrl: string | null;
  shelfReference: string | null;
  sectionName: string | null;
  stockSummary: Omit<StockSummary, 'isAvailableNow'>;
  canDeleteTitle: boolean;
  deleteDisabledReason: string | null;
  copies: BookDetailCopy[];
  viewerContext: ViewerContext | null;
}

// Section 6.1: GET /me/borrowing
export interface AccountSummary {
  canBorrow: boolean;
  statusText: string;
  activeLoansCount: number;
  maxLoansLimit: number;
  remainingLoanSpace: number;
  overdueBooksCount: number;
  unpaidFines: number;
}

export interface CurrentLoanItem {
  _id: string;
  borrowCode: string;
  copyCode: string;
  book: {
    _id: string;
    title: string;
    author: string;
    coverImageUrl: string | null;
  };
  borrowedAt: string;
  dueDate: string;
  daysLeft: number;
  isOverdue: boolean;
  renewalCount: number;
  canRenew: boolean;
  renewalStatusText: string;
  newDueDatePreview: string | null;
}

export interface HoldRequestItem {
  _id: string;
  holdCode: string;
  status: HoldStatus;
  requestedAt: string;
  collectBy: string;
  pickupLocation: string;
  book: {
    _id: string;
    title: string;
    author: string;
    format: string;
    coverImageUrl: string | null;
  };
  copy: {
    _id: string;
    copyCode: string;
    homeLocation: string;
  };
}

export interface BorrowingHistoryItem {
  _id: string;
  borrowCode: string;
  copyCode: string;
  book: {
    _id: string;
    title: string;
    author: string;
    coverImageUrl: string | null;
  };
  borrowedAt: string;
  dueDate: string;
  returnedAt: string;
  returnCondition: CopyCondition;
}

export interface MyBorrowingDashboard {
  accountSummary: AccountSummary;
  currentLoans: CurrentLoanItem[];
  holdRequests: HoldRequestItem[];
  borrowingHistory: BorrowingHistoryItem[];
}

// Section 6.2: POST /holds
export interface CreateHoldRequestBody {
  bookId: string;
}

export interface HoldConfirmation {
  _id: string;
  holdCode: string;
  status: HoldStatus;
  requestedAt: string;
  collectBy: string;
  book: {
    _id: string;
    title: string;
    author: string;
    format: string;
    shelfReference: string | null;
    coverImageUrl: string | null;
    stockSummary: {
      totalCopies: number;
      availableCopies: number;
      borrowedCopies: number;
      reservedCopies: number;
    };
  };
  assignedCopy: {
    _id: string;
    copyCode: string;
    homeLocation: string;
  };
  studentLoanUsage: {
    activeLoansCount: number;
    maxLoansLimit: number;
  };
}

// Section 6.3: DELETE /holds/:id
export interface CancelHoldResult {
  holdCode: string;
  status: 'Cancelled';
  releasedCopyCode: string;
}

// Section 6.4: POST /loans/:id/renew
export interface RenewLoanResult {
  _id: string;
  borrowCode: string;
  previousDueDate: string;
  newDueDate: string;
  daysLeft: number;
  renewalCount: number;
  canRenew: boolean;
}
