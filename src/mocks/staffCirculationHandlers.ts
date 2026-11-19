import { delay, http, HttpResponse } from 'msw';
import { AUTH_USER_KEY } from '../api/client';
import {
  CopyCheckoutCheck,
  IssueBooksRequestBody,
  IssueTransactionReceipt,
  StudentCheckoutProfile,
} from '../types/api';
import {
  addDaysToIsoDate,
  calculateDaysDifference,
  getDemoToday,
  getMockDb,
  MockDatabase,
  MockLoanRecord,
  MockUserRecord,
  saveMockDb,
} from './db';

const API_BASE = '/api/v1';

function errorResponse(status: number, code: string, message: string) {
  return HttpResponse.json(
    {
      success: false,
      error: { code, message },
    },
    { status },
  );
}

function normalizeCode(raw: string): string {
  return raw.trim().replace(/[–—]/g, '-').toLowerCase();
}

function isStaffAllowed(cookies?: Record<string, string>): boolean {
  const db = getMockDb();
  const cookieAccountId = cookies?.bookborrow_mock_session || '';
  if (cookieAccountId) {
    return db.users.some(
      (u) =>
        u.accountId.toLowerCase() === cookieAccountId.toLowerCase() &&
        u.role === 'staff' &&
        u.status === 'Active',
    );
  }
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (raw) {
      const stored = JSON.parse(raw) as { role?: string; status?: string };
      return stored.role === 'staff' && stored.status === 'Active';
    }
  } catch {
    // ignore storage errors
  }
  return false;
}

function syncStudent(user: MockUserRecord, db: MockDatabase): MockUserRecord {
  const today = getDemoToday();
  const activeLoans = db.loans.filter(
    (l) => l.studentId === user._id && l.status === 'Active',
  );
  const overdueLoans = activeLoans.filter(
    (l) => calculateDaysDifference(today, l.dueDate) < 0,
  );
  user.activeLoansCount = activeLoans.length;
  user.overdueLoansCount = overdueLoans.length;
  return user;
}

export const staffCirculationHandlers = [
  // 7.1 GET /staff/students/:accountId
  http.get(
    `${API_BASE}/staff/students/:accountId`,
    async ({ params, cookies }) => {
      await delay(140);
      if (!isStaffAllowed(cookies)) {
        return errorResponse(403, 'FORBIDDEN_ACCESS', 'Staff access required.');
      }

      const accountIdParam = String(params.accountId || '').trim();
      const db = getMockDb();
      const found = db.users.find(
        (u) =>
          u.role === 'student' &&
          u.accountId.toLowerCase() === accountIdParam.toLowerCase(),
      );

      if (!found) {
        return errorResponse(
          404,
          'STUDENT_NOT_FOUND',
          `No student account matches "${accountIdParam}".`,
        );
      }

      const student = syncStudent(found, db);
      const remainingLoanSpace = Math.max(
        0,
        student.maxLoansLimit - student.activeLoansCount,
      );
      const isEligible =
        student.status === 'Active' &&
        student.overdueLoansCount === 0 &&
        student.unpaidFines === 0 &&
        remainingLoanSpace > 0;

      let statusBanner = `No overdue books · No unpaid fines. You can select up to ${remainingLoanSpace} additional ${
        remainingLoanSpace === 1 ? 'copy' : 'copies'
      }.`;
      if (student.status !== 'Active') {
        statusBanner =
          'This student account is locked and cannot borrow books.';
      } else if (student.overdueLoansCount > 0 && student.unpaidFines > 0) {
        statusBanner = `Borrowing blocked · ${student.overdueLoansCount} overdue ${
          student.overdueLoansCount === 1 ? 'book' : 'books'
        } and $${student.unpaidFines.toFixed(2)} in unpaid fines must be resolved first.`;
      } else if (student.overdueLoansCount > 0) {
        statusBanner = `Borrowing blocked · ${student.overdueLoansCount} overdue ${
          student.overdueLoansCount === 1 ? 'book' : 'books'
        } must be returned before issuing new loans.`;
      } else if (student.unpaidFines > 0) {
        statusBanner = `Borrowing blocked · Unpaid fines ($${student.unpaidFines.toFixed(
          2,
        )}) must be settled first.`;
      } else if (remainingLoanSpace === 0) {
        statusBanner = `Borrowing limit reached (${student.activeLoansCount} of ${student.maxLoansLimit} books on loan).`;
      }

      const activeHolds = db.holds
        .filter((h) => h.studentId === student._id && h.status === 'Ready')
        .map((h) => {
          const book = db.books.find((b) => b._id === h.bookId);
          return {
            holdCode: h.holdCode,
            copyCode: h.copyCode,
            bookTitle: book?.title || 'Library Title',
            collectBy: h.collectBy,
          };
        });

      const payload: StudentCheckoutProfile = {
        student: {
          _id: student._id,
          accountId: student.accountId,
          fullName: student.fullName,
          initials: student.initials,
          yearGroup: student.yearGroup,
        },
        eligibility: {
          isEligible,
          activeLoansCount: student.activeLoansCount,
          maxLoansLimit: student.maxLoansLimit,
          remainingLoanSpace,
          overdueBooksCount: student.overdueLoansCount,
          unpaidFines: student.unpaidFines,
          statusBanner,
        },
        activeHolds,
      };

      return HttpResponse.json({
        success: true,
        data: payload,
      });
    },
  ),

  // 7.2 GET /staff/copies/:copyCode/checkout-check
  http.get(
    `${API_BASE}/staff/copies/:copyCode/checkout-check`,
    async ({ params, request, cookies }) => {
      await delay(140);
      if (!isStaffAllowed(cookies)) {
        return errorResponse(403, 'FORBIDDEN_ACCESS', 'Staff access required.');
      }

      const copyCodeParam = normalizeCode(String(params.copyCode || ''));
      const url = new URL(request.url);
      const studentAccountId = (
        url.searchParams.get('studentAccountId') || ''
      ).trim();

      if (!studentAccountId) {
        return errorResponse(
          400,
          'VALIDATION_ERROR',
          'studentAccountId query parameter is required.',
        );
      }

      const db = getMockDb();
      const student = db.users.find(
        (u) =>
          u.role === 'student' &&
          u.accountId.toLowerCase() === studentAccountId.toLowerCase(),
      );
      if (!student) {
        return errorResponse(
          404,
          'STUDENT_NOT_FOUND',
          `No student account matches "${studentAccountId}".`,
        );
      }

      const copy = db.copies.find(
        (c) => normalizeCode(c.copyCode) === copyCodeParam,
      );
      if (!copy) {
        return errorResponse(
          404,
          'COPY_NOT_FOUND',
          `No physical copy matches "${String(params.copyCode || '')}".`,
        );
      }

      const book = db.books.find((b) => b._id === copy.bookId);
      if (!book) {
        return errorResponse(404, 'BOOK_NOT_FOUND', 'Book title not found.');
      }

      const today = getDemoToday();
      const defaultDueDate = addDaysToIsoDate(today, 14);
      const firstName = student.fullName.split(' ')[0] || student.fullName;

      const activeHold = db.holds.find(
        (h) => h.copyId === copy._id && h.status === 'Ready',
      );
      const activeLoan = db.loans.find(
        (l) => l.copyId === copy._id && l.status === 'Active',
      );

      let canAdd = false;
      let availabilityBadge: string = copy.state;
      let associatedHold: CopyCheckoutCheck['associatedHold'] = null;
      let blockingInfo: CopyCheckoutCheck['blockingInfo'] = null;

      if (copy.state === 'Available') {
        canAdd = true;
        availabilityBadge = 'Available';
      } else if (
        copy.state === 'Reserved' &&
        activeHold &&
        activeHold.studentId === student._id
      ) {
        canAdd = true;
        availabilityBadge = `Reserved for ${firstName}`;
        associatedHold = {
          _id: activeHold._id,
          holdCode: activeHold.holdCode,
          collectBy: activeHold.collectBy,
        };
      } else if (copy.state === 'Borrowed' || activeLoan) {
        canAdd = false;
        availabilityBadge = 'Already borrowed';
        const borrowerName = activeLoan?.studentName || 'another student';
        const borrowerAccountId = activeLoan?.studentAccountId || '';
        const dueDate = activeLoan?.dueDate || null;
        blockingInfo = {
          reasonCode: 'ALREADY_BORROWED',
          message: `${copy.copyCode} is already borrowed — not added. ${book.title} · ${borrowerName}${
            borrowerAccountId ? ` (${borrowerAccountId})` : ''
          }${dueDate ? `, due ${dueDate}` : ''}. Enter a different copy ID.`,
          currentBorrowerName: activeLoan?.studentName || null,
          currentBorrowerAccountId: activeLoan?.studentAccountId || null,
          currentDueDate: dueDate,
        };
      } else if (copy.state === 'Reserved') {
        canAdd = false;
        availabilityBadge = 'Reserved for another student';
        const holderName = activeHold?.studentName || 'another student';
        const holderAccountId = activeHold?.studentAccountId || '';
        blockingInfo = {
          reasonCode: 'RESERVED_FOR_OTHER',
          message: `${copy.copyCode} is reserved for ${holderName}${
            holderAccountId ? ` (${holderAccountId})` : ''
          } — not added. Never release another student's reserved copy at checkout.`,
          currentBorrowerName: activeHold?.studentName || null,
          currentBorrowerAccountId: activeHold?.studentAccountId || null,
          currentDueDate: activeHold?.collectBy || null,
        };
      } else {
        canAdd = false;
        availabilityBadge = copy.state;
        blockingInfo = {
          reasonCode: 'COPY_UNAVAILABLE',
          message: `${copy.copyCode} is marked ${copy.state} (${copy.condition}) and cannot be issued.`,
          currentBorrowerName: null,
          currentBorrowerAccountId: null,
          currentDueDate: null,
        };
      }

      const payload: CopyCheckoutCheck = {
        copy: {
          _id: copy._id,
          copyCode: copy.copyCode,
          state: copy.state,
          condition: copy.condition,
          homeLocation: copy.homeLocation,
        },
        book: {
          _id: book._id,
          title: book.title,
          author: book.author,
          coverImageUrl: book.coverImageUrl,
        },
        canAdd,
        availabilityBadge,
        defaultDueDate,
        associatedHold,
        blockingInfo,
      };

      return HttpResponse.json({
        success: true,
        data: payload,
      });
    },
  ),

  // 7.3 POST /staff/loans/issue
  http.post(`${API_BASE}/staff/loans/issue`, async ({ request, cookies }) => {
    await delay(160);
    if (!isStaffAllowed(cookies)) {
      return errorResponse(403, 'FORBIDDEN_ACCESS', 'Staff access required.');
    }

    const body = (await request
      .json()
      .catch(() => ({}))) as Partial<IssueBooksRequestBody>;
    const studentAccountId = (body.studentAccountId || '').trim();
    const items = Array.isArray(body.items) ? body.items : [];

    if (!studentAccountId || items.length === 0) {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        'studentAccountId and at least one copy item are required.',
      );
    }

    const seenCodes = new Set<string>();
    for (const item of items) {
      const code = normalizeCode(String(item?.copyCode || ''));
      if (!code || !item?.dueDate) {
        return errorResponse(
          400,
          'VALIDATION_ERROR',
          'Each item must include copyCode and dueDate.',
        );
      }
      if (seenCodes.has(code)) {
        return errorResponse(
          400,
          'DUPLICATE_COPY_IN_BATCH',
          `Duplicate copy ID "${item.copyCode}" in the same checkout batch.`,
        );
      }
      seenCodes.add(code);
    }

    const db = getMockDb();
    const foundStudent = db.users.find(
      (u) =>
        u.role === 'student' &&
        u.accountId.toLowerCase() === studentAccountId.toLowerCase(),
    );
    if (!foundStudent) {
      return errorResponse(
        404,
        'STUDENT_NOT_FOUND',
        `No student account matches "${studentAccountId}".`,
      );
    }

    const student = syncStudent(foundStudent, db);
    if (
      student.status !== 'Active' ||
      student.overdueLoansCount > 0 ||
      student.unpaidFines > 0
    ) {
      return errorResponse(
        403,
        'BORROWER_INELIGIBLE',
        'Student has an inactive account, overdue books, or unpaid fines and cannot borrow.',
      );
    }

    const loansBefore = student.activeLoansCount;
    if (loansBefore + items.length > student.maxLoansLimit) {
      return errorResponse(
        403,
        'LOAN_LIMIT_EXCEEDED',
        `Issuing ${items.length} ${
          items.length === 1 ? 'book' : 'books'
        } would exceed the ${student.maxLoansLimit}-book loan limit (currently ${loansBefore} active).`,
      );
    }

    // Validate all copies first before mutating state
    const resolvedItems = [];
    for (const item of items) {
      const normCode = normalizeCode(item.copyCode);
      const copy = db.copies.find((c) => normalizeCode(c.copyCode) === normCode);
      if (!copy) {
        return errorResponse(
          404,
          'COPY_NOT_FOUND',
          `Physical copy "${item.copyCode}" was not found.`,
        );
      }
      const book = db.books.find((b) => b._id === copy.bookId);
      if (!book) {
        return errorResponse(404, 'BOOK_NOT_FOUND', 'Book title not found.');
      }

      const activeHold = db.holds.find(
        (h) => h.copyId === copy._id && h.status === 'Ready',
      );
      const isReservedForStudent =
        copy.state === 'Reserved' &&
        activeHold &&
        activeHold.studentId === student._id;

      if (copy.state !== 'Available' && !isReservedForStudent) {
        return errorResponse(
          409,
          'COPY_NOT_AVAILABLE_FOR_STUDENT',
          `Copy ${copy.copyCode} is currently ${copy.state} and cannot be issued to ${student.fullName}.`,
        );
      }

      resolvedItems.push({
        copy,
        book,
        dueDate: item.dueDate,
        matchingHold: isReservedForStudent ? activeHold : null,
      });
    }

    const today = getDemoToday();
    const issuedAt = new Date().toISOString();
    const firstName = student.fullName.split(' ')[0] || student.fullName;
    const borrowEntries: IssueTransactionReceipt['borrowEntries'] = [];
    const fulfilledHolds: IssueTransactionReceipt['fulfilledHolds'] = [];

    for (const entry of resolvedItems) {
      const borrowCode = `BR-${db.nextBorrowSeq++}`;
      const newLoan: MockLoanRecord = {
        _id: `loan_${Date.now()}_${borrowCode}`,
        borrowCode,
        studentId: student._id,
        studentAccountId: student.accountId,
        studentName: student.fullName,
        bookId: entry.book._id,
        copyId: entry.copy._id,
        copyCode: entry.copy.copyCode,
        borrowedAt: today,
        dueDate: entry.dueDate,
        returnedAt: null,
        returnCondition: null,
        conditionNote: null,
        status: 'Active',
        renewalCount: 0,
      };

      db.loans.unshift(newLoan);
      entry.copy.state = 'Borrowed';
      entry.copy.hasLoanHistory = true;
      entry.copy.updatedAt = issuedAt;

      if (entry.matchingHold) {
        entry.matchingHold.status = 'Fulfilled';
        fulfilledHolds.push({
          holdCode: entry.matchingHold.holdCode,
          copyCode: entry.copy.copyCode,
          message: `${entry.copy.copyCode} was reserved for ${firstName}. Collection is confirmed; this copy is no longer held.`,
        });
      }

      borrowEntries.push({
        _id: newLoan._id,
        borrowCode,
        copyCode: entry.copy.copyCode,
        book: {
          _id: entry.book._id,
          title: entry.book.title,
          author: entry.book.author,
          coverImageUrl: entry.book.coverImageUrl,
        },
        borrowedAt: today,
        dueDate: entry.dueDate,
      });
    }

    student.hasBorrowingHistory = true;
    syncStudent(student, db);
    saveMockDb(db);

    const loansNow = student.activeLoansCount;
    const remainingLoanSpace = Math.max(0, student.maxLoansLimit - loansNow);
    const receipt: IssueTransactionReceipt = {
      issuedAt,
      borrowEntries,
      fulfilledHolds,
      borrowerSummary: {
        studentId: student._id,
        accountId: student.accountId,
        fullName: student.fullName,
        initials: student.initials,
        yearGroup: student.yearGroup,
        loansBefore,
        loansNow,
        maxLoansLimit: student.maxLoansLimit,
        remainingLoanSpace,
      },
    };

    return HttpResponse.json(
      {
        success: true,
        message: `${borrowEntries.length} ${
          borrowEntries.length === 1 ? 'book' : 'books'
        } issued. Checkout confirmed for ${student.fullName} · ${
          student.accountId
        }`,
        data: receipt,
      },
      { status: 201 },
    );
  }),
];
