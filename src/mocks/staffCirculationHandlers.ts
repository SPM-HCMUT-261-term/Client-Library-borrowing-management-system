import { delay, http, HttpResponse } from 'msw';
import { AUTH_USER_KEY } from '../api/client';
import {
  ActiveLoanLookup,
  CopyCheckoutCheck,
  CopyCondition,
  IssueBooksRequestBody,
  IssueTransactionReceipt,
  ReturnBookRequestBody,
  ReturnDetail,
  StaffActiveHoldItem,
  StaffLoanRecordItem,
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

  // 7.4 GET /staff/loans/active-by-copy/:copyCode
  http.get(
    `${API_BASE}/staff/loans/active-by-copy/:copyCode`,
    async ({ params, cookies }) => {
      await delay(140);
      if (!isStaffAllowed(cookies)) {
        return errorResponse(403, 'FORBIDDEN_ACCESS', 'Staff access required.');
      }

      const rawCopyCode = String(params.copyCode || '').trim();
      const normCode = normalizeCode(rawCopyCode);
      const db = getMockDb();

      const copy = db.copies.find((c) => normalizeCode(c.copyCode) === normCode);
      if (!copy) {
        return errorResponse(
          404,
          'ACTIVE_LOAN_NOT_FOUND',
          `No physical copy or active loan matches "${rawCopyCode}". Only an active loan can be checked in.`,
        );
      }

      const activeLoan = db.loans.find(
        (l) => l.copyId === copy._id && l.status === 'Active',
      );
      if (!activeLoan) {
        return errorResponse(
          404,
          'ACTIVE_LOAN_NOT_FOUND',
          `Copy ${copy.copyCode} does not currently have an active loan. A copy already returned will not be returned again.`,
        );
      }

      const book = db.books.find((b) => b._id === copy.bookId);
      if (!book) {
        return errorResponse(404, 'BOOK_NOT_FOUND', 'Book title not found.');
      }

      const foundBorrower = db.users.find(
        (u) => u._id === activeLoan.studentId,
      );
      const borrower = foundBorrower
        ? syncStudent(foundBorrower, db)
        : {
            _id: activeLoan.studentId,
            accountId: activeLoan.studentAccountId,
            fullName: activeLoan.studentName,
            initials: activeLoan.studentName
              .split(' ')
              .map((p) => p[0])
              .join('')
              .slice(0, 2)
              .toUpperCase(),
            yearGroup: null,
            activeLoansCount: 1,
            maxLoansLimit: 5,
          };

      const today = getDemoToday();
      const daysDiff = calculateDaysDifference(today, activeLoan.dueDate);
      const isOverdue = daysDiff < 0;
      const overdueDays = Math.abs(daysDiff);
      const timingBadge = isOverdue
        ? `Overdue · ${overdueDays} ${overdueDays === 1 ? 'day' : 'days'}`
        : daysDiff === 0
          ? 'Due today'
          : daysDiff === 1
            ? 'Due tomorrow'
            : 'On time';

      const activeLoansBeforeReturn = borrower.activeLoansCount;
      const activeLoansAfterReturn = Math.max(0, activeLoansBeforeReturn - 1);

      const payload: ActiveLoanLookup = {
        loan: {
          _id: activeLoan._id,
          borrowCode: activeLoan.borrowCode,
          borrowedAt: activeLoan.borrowedAt,
          dueDate: activeLoan.dueDate,
          returningToday: today,
          isOverdue,
          timingBadge,
        },
        copy: {
          _id: copy._id,
          copyCode: copy.copyCode,
          currentCondition: copy.condition,
          homeLocation: copy.homeLocation,
        },
        book: {
          _id: book._id,
          title: book.title,
          author: book.author,
          coverImageUrl: book.coverImageUrl,
        },
        borrower: {
          _id: borrower._id,
          accountId: borrower.accountId,
          fullName: borrower.fullName,
          initials: borrower.initials,
          yearGroup: borrower.yearGroup,
          activeLoansBeforeReturn,
          activeLoansAfterReturn,
          maxLoansLimit: borrower.maxLoansLimit,
        },
      };

      return HttpResponse.json({
        success: true,
        data: payload,
      });
    },
  ),

  // 7.5 POST /staff/loans/:id/return
  http.post(
    `${API_BASE}/staff/loans/:id/return`,
    async ({ params, request, cookies }) => {
      await delay(150);
      if (!isStaffAllowed(cookies)) {
        return errorResponse(403, 'FORBIDDEN_ACCESS', 'Staff access required.');
      }

      const idParam = String(params.id || '').trim();
      const normId = normalizeCode(idParam);
      const body = (await request
        .json()
        .catch(() => ({}))) as Partial<ReturnBookRequestBody>;
      const condition = body.condition as CopyCondition;

      if (!['Good', 'Damaged', 'Lost'].includes(condition)) {
        return errorResponse(
          400,
          'VALIDATION_ERROR',
          'Return condition must be one of "Good", "Damaged", or "Lost".',
        );
      }

      const db = getMockDb();
      const loan = db.loans.find(
        (l) => l._id === idParam || normalizeCode(l.borrowCode) === normId,
      );
      if (!loan) {
        return errorResponse(404, 'LOAN_NOT_FOUND', 'Loan record not found.');
      }

      if (loan.status === 'Returned') {
        return errorResponse(
          409,
          'LOAN_ALREADY_RETURNED',
          'Only an active loan can be checked in. A copy already returned will not be returned again.',
        );
      }

      const copy = db.copies.find((c) => c._id === loan.copyId);
      if (!copy) {
        return errorResponse(
          404,
          'COPY_NOT_FOUND',
          'Associated physical copy not found.',
        );
      }

      const student = db.users.find((u) => u._id === loan.studentId);
      if (student) {
        syncStudent(student, db);
      }
      const loansBefore = student ? student.activeLoansCount : 1;

      const returnedAt = new Date().toISOString();
      const newState: ReturnDetail['copy']['newState'] =
        condition === 'Good' ? 'Available' : condition;

      loan.status = 'Returned';
      loan.returnedAt = returnedAt;
      loan.returnCondition = condition;
      loan.conditionNote = body.conditionNote?.trim() || null;

      copy.condition = condition;
      copy.state = newState;
      copy.hasLoanHistory = true;
      copy.updatedAt = returnedAt;
      if (loan.conditionNote) {
        copy.notes = loan.conditionNote;
      }

      if (student) {
        syncStudent(student, db);
      }
      const loansAfter = student
        ? student.activeLoansCount
        : Math.max(0, loansBefore - 1);

      saveMockDb(db);

      const detail: ReturnDetail = {
        _id: loan._id,
        borrowCode: loan.borrowCode,
        status: 'Returned',
        borrower: {
          accountId: loan.studentAccountId,
          fullName: loan.studentName,
          loansBefore,
          loansAfter,
        },
        borrowedAt: loan.borrowedAt,
        dueDate: loan.dueDate,
        returnedAt,
        returnCondition: condition,
        conditionNote: loan.conditionNote,
        copy: {
          copyCode: copy.copyCode,
          newState,
          homeLocation: copy.homeLocation,
        },
      };

      return HttpResponse.json({
        success: true,
        message: 'Book return confirmed and saved in returned history.',
        data: detail,
      });
    },
  ),

  // 7.6 GET /staff/loans
  http.get(`${API_BASE}/staff/loans`, async ({ request, cookies }) => {
    await delay(140);
    if (!isStaffAllowed(cookies)) {
      return errorResponse(403, 'FORBIDDEN_ACCESS', 'Staff access required.');
    }

    const url = new URL(request.url);
    const tab = url.searchParams.get('tab') === 'returned' ? 'returned' : 'active';
    const qRaw = (url.searchParams.get('q') || '').trim().toLowerCase();
    const qNorm = normalizeCode(qRaw);
    const statusFilter = url.searchParams.get('status') || 'all';
    const sortBy =
      (url.searchParams.get('sortBy') as
        | 'dueDate'
        | 'borrowedAt'
        | 'returnedAt') || (tab === 'returned' ? 'returnedAt' : 'dueDate');
    const sortOrder = url.searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc';
    const pageParam = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
    const limitParam = Math.max(1, parseInt(url.searchParams.get('limit') || '6', 10) || 6);

    const db = getMockDb();
    const today = getDemoToday();

    const mapped: Array<StaffLoanRecordItem & { daysDiff: number }> = db.loans
      .filter((l) =>
        tab === 'returned' ? l.status === 'Returned' : l.status === 'Active',
      )
      .map((l) => {
        const book = db.books.find((b) => b._id === l.bookId);
        const daysDiff = calculateDaysDifference(today, l.dueDate);
        const isOverdue = l.status === 'Active' && daysDiff < 0;
        let statusBadge = 'On loan';
        if (l.status === 'Returned') {
          statusBadge =
            l.returnCondition && l.returnCondition !== 'Good'
              ? `Returned · ${l.returnCondition}`
              : 'Returned';
        } else if (isOverdue) {
          const overdueDays = Math.abs(daysDiff);
          statusBadge = `Overdue · ${overdueDays} ${
            overdueDays === 1 ? 'day' : 'days'
          }`;
        } else if (daysDiff === 0) {
          statusBadge = 'Due today';
        } else if (daysDiff === 1) {
          statusBadge = 'Due tomorrow';
        } else if (daysDiff === 2) {
          statusBadge = 'Due in 2 days';
        }

        return {
          _id: l._id,
          borrowCode: l.borrowCode,
          status: l.status,
          book: {
            _id: book?._id || l.bookId,
            title: book?.title || 'Library Title',
            author: book?.author || 'Unknown Author',
            coverImageUrl: book?.coverImageUrl ?? null,
          },
          copy: {
            _id: l.copyId,
            copyCode: l.copyCode,
          },
          borrower: {
            _id: l.studentId,
            fullName: l.studentName,
            accountId: l.studentAccountId,
          },
          borrowedAt: l.borrowedAt,
          dueDate: l.dueDate,
          returnedAt: l.returnedAt,
          returnCondition: l.returnCondition,
          isOverdue,
          statusBadge,
          daysDiff,
        };
      });

    const filtered = mapped.filter((item) => {
      if (tab === 'active' && statusFilter !== 'all') {
        if (statusFilter === 'overdue' && !item.isOverdue) return false;
        if (
          statusFilter === 'due_soon' &&
          (item.daysDiff < 0 || item.daysDiff > 2)
        )
          return false;
        if (statusFilter === 'on_loan' && item.daysDiff <= 2) return false;
      }

      if (qRaw) {
        const matchesText =
          item.borrower.fullName.toLowerCase().includes(qRaw) ||
          item.borrower.accountId.toLowerCase().includes(qRaw) ||
          item.book.title.toLowerCase().includes(qRaw) ||
          item.book.author.toLowerCase().includes(qRaw) ||
          normalizeCode(item.copy.copyCode).includes(qNorm) ||
          normalizeCode(item.borrowCode).includes(qNorm);
        if (!matchesText) return false;
      }

      return true;
    });

    filtered.sort((a, b) => {
      const keyA =
        sortBy === 'returnedAt'
          ? a.returnedAt || a.dueDate
          : sortBy === 'borrowedAt'
            ? a.borrowedAt
            : a.dueDate;
      const keyB =
        sortBy === 'returnedAt'
          ? b.returnedAt || b.dueDate
          : sortBy === 'borrowedAt'
            ? b.borrowedAt
            : b.dueDate;
      const cmp = keyA.localeCompare(keyB);
      return sortOrder === 'desc' ? -cmp : cmp;
    });

    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / limitParam));
    const currentPage = Math.min(pageParam, totalPages);
    const startIndex = (currentPage - 1) * limitParam;
    const items: StaffLoanRecordItem[] = filtered
      .slice(startIndex, startIndex + limitParam)
      .map(({ daysDiff: _daysDiff, ...rest }) => rest);

    return HttpResponse.json({
      success: true,
      data: {
        items,
        pagination: {
          totalItems,
          currentPage,
          totalPages,
          limit: limitParam,
        },
      },
    });
  }),

  // 7.7 GET /staff/holds
  http.get(`${API_BASE}/staff/holds`, async ({ request, cookies }) => {
    await delay(140);
    if (!isStaffAllowed(cookies)) {
      return errorResponse(403, 'FORBIDDEN_ACCESS', 'Staff access required.');
    }

    const url = new URL(request.url);
    const qRaw = (url.searchParams.get('q') || '').trim().toLowerCase();
    const qNorm = normalizeCode(qRaw);
    const pageParam = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
    const limitParam = Math.max(1, parseInt(url.searchParams.get('limit') || '10', 10) || 10);

    const db = getMockDb();
    const today = getDemoToday();
    const demoNowMs = new Date(`${today}T11:00:00Z`).getTime();

    const mapped: StaffActiveHoldItem[] = db.holds
      .filter((h) => h.status === 'Ready')
      .map((h) => {
        const student = db.users.find((u) => u._id === h.studentId);
        const book = db.books.find((b) => b._id === h.bookId);
        const copy = db.copies.find((c) => c._id === h.copyId);
        const collectByMs = new Date(h.collectBy).getTime();

        return {
          _id: h._id,
          holdCode: h.holdCode,
          status: 'Ready' as const,
          requestedAt: h.requestedAt,
          collectBy: h.collectBy,
          isPastDeadline:
            !Number.isNaN(collectByMs) && demoNowMs > collectByMs,
          student: {
            _id: h.studentId,
            accountId: h.studentAccountId,
            fullName: h.studentName,
            yearGroup: student?.yearGroup ?? null,
          },
          book: {
            _id: book?._id || h.bookId,
            title: book?.title || 'Library Title',
            author: book?.author || 'Unknown Author',
            coverImageUrl: book?.coverImageUrl ?? null,
          },
          copy: {
            _id: h.copyId,
            copyCode: h.copyCode,
            homeLocation: copy?.homeLocation || h.pickupLocation,
          },
        };
      })
      .filter((item) => {
        if (!qRaw) return true;
        return (
          normalizeCode(item.holdCode).includes(qNorm) ||
          normalizeCode(item.copy.copyCode).includes(qNorm) ||
          item.student.accountId.toLowerCase().includes(qRaw) ||
          item.student.fullName.toLowerCase().includes(qRaw) ||
          item.book.title.toLowerCase().includes(qRaw)
        );
      });

    const totalItems = mapped.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / limitParam));
    const currentPage = Math.min(pageParam, totalPages);
    const startIndex = (currentPage - 1) * limitParam;
    const items = mapped.slice(startIndex, startIndex + limitParam);

    return HttpResponse.json({
      success: true,
      data: {
        items,
        pagination: {
          totalItems,
          currentPage,
          totalPages,
          limit: limitParam,
        },
      },
    });
  }),
];
