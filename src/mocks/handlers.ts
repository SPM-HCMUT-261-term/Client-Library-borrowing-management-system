import { adminHandlers } from './adminHandlers';
import { http, HttpResponse, delay } from 'msw';
import {
  addDaysToIsoDate,
  calculateDaysDifference,
  computeStockSummary,
  getDemoToday,
  getMockDb,
  MockDatabase,
  MockUserRecord,
  saveMockDb,
} from './db';
import {
  BookDetail,
  CatalogBookItem,
  CurrentLoanItem,
  FeaturedBookItem,
  HoldConfirmation,
  HoldRequestItem,
  LoginRequestBody,
  MyBorrowingDashboard,
} from '../types/api';

const API_BASE = '/api/v1';

function errorResponse(
  status: number,
  code: string,
  message: string,
  details?: Record<string, unknown>,
) {
  return HttpResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status },
  );
}

function getAuthenticatedUser(
  request: Request,
  db: MockDatabase,
): MockUserRecord | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token.startsWith('mock-jwt-')) {
    return null;
  }
  const accountId = token.replace('mock-jwt-', '');
  const user = db.users.find(
    (u) => u.accountId.toLowerCase() === accountId.toLowerCase(),
  );
  if (!user || user.status !== 'Active') {
    return null;
  }
  return syncUserCounters(user, db);
}

function syncUserCounters(
  user: MockUserRecord,
  db: MockDatabase,
): MockUserRecord {
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

function sanitizeUser(user: MockUserRecord) {
  const { password: _password, ...rest } = user;
  return rest;
}

export const handlers = [
  ...adminHandlers,
  // 3.1 POST /auth/login
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    await delay(180);
    let body: Partial<LoginRequestBody> = {};
    try {
      body = (await request.json()) as Partial<LoginRequestBody>;
    } catch {
      return errorResponse(
        400,
        'INVALID_INPUT',
        'Please provide your school account ID, password, and selected role.',
      );
    }

    const accountId = body.accountId?.trim();
    const password = body.password;
    const role = body.role;

    if (!accountId || !password || !role) {
      return errorResponse(
        400,
        'INVALID_INPUT',
        'Missing school account ID, password, or role.',
      );
    }

    const db = getMockDb();
    const user = db.users.find(
      (u) => u.accountId.toLowerCase() === accountId.toLowerCase(),
    );

    if (!user || user.password !== password) {
      return errorResponse(
        401,
        'INVALID_CREDENTIALS',
        'Invalid school account ID or password. Use your school-issued ID (e.g. S10428).',
      );
    }

    if (user.status === 'Inactive') {
      return errorResponse(
        403,
        'ACCOUNT_INACTIVE',
        'This account has been deactivated by an administrator. Ask at the library counter for assistance.',
      );
    }

    if (user.role !== role) {
      return errorResponse(
        403,
        'ROLE_MISMATCH',
        `Your account does not have the ${role} role assigned by the school. Please sign in as ${user.role}.`,
      );
    }

    const synced = syncUserCounters(user, db);
    saveMockDb(db);

    return HttpResponse.json({
      success: true,
      data: {
        accessToken: `mock-jwt-${synced.accountId}`,
        user: {
          _id: synced._id,
          accountId: synced.accountId,
          fullName: synced.fullName,
          initials: synced.initials,
          role: synced.role,
          status: synced.status,
          yearGroup: synced.yearGroup,
          activeLoansCount: synced.activeLoansCount,
          maxLoansLimit: synced.maxLoansLimit,
        },
      },
    });
  }),

  // 3.2 GET /auth/me
  http.get(`${API_BASE}/auth/me`, async ({ request }) => {
    await delay(100);
    const db = getMockDb();
    const user = getAuthenticatedUser(request, db);
    if (!user) {
      return errorResponse(401, 'UNAUTHORIZED', 'Authentication required.');
    }
    return HttpResponse.json({
      success: true,
      data: sanitizeUser(user),
    });
  }),

  // 3.3 POST /auth/logout
  http.post(`${API_BASE}/auth/logout`, async () => {
    await delay(80);
    return HttpResponse.json({
      success: true,
      message: 'Signed out successfully',
      data: null,
    });
  }),

  // 4.1 GET /books/featured
  http.get(`${API_BASE}/books/featured`, async ({ request }) => {
    await delay(120);
    const url = new URL(request.url);
    const limitParam = parseInt(url.searchParams.get('limit') || '4', 10);
    const limit = Number.isNaN(limitParam) || limitParam <= 0 ? 4 : limitParam;

    const db = getMockDb();
    const featuredBooks: FeaturedBookItem[] = db.featuredBookIds
      .map((id) => db.books.find((b) => b._id === id))
      .filter((b): b is NonNullable<typeof b> => Boolean(b))
      .slice(0, limit)
      .map((book) => {
        const stock = computeStockSummary(book._id, db.copies);
        return {
          _id: book._id,
          title: book.title,
          author: book.author,
          category: book.category,
          genre: book.genre,
          coverImageUrl: book.coverImageUrl,
          shelfReference: book.shelfReference,
          stockSummary: {
            totalCopies: stock.totalCopies,
            availableCopies: stock.availableCopies,
            isAvailableNow: stock.isAvailableNow,
          },
        };
      });

    return HttpResponse.json({
      success: true,
      data: featuredBooks,
    });
  }),

  // 4.2 GET /books
  http.get(`${API_BASE}/books`, async ({ request }) => {
    await delay(140);
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') || '').trim().toLowerCase();
    const categoryParam = url.searchParams.get('category') || '';
    const genreParam = url.searchParams.get('genre') || '';
    const languageParam = url.searchParams.get('language') || '';
    const availableNowParam = url.searchParams.get('availableNow');
    const stockParam = url.searchParams.get('stock') || 'all';
    const sortBy = url.searchParams.get('sortBy') || 'relevance';
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(url.searchParams.get('limit') || '6', 10));

    const categories = categoryParam
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const genres = genreParam
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const languages = languageParam
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const db = getMockDb();

    let enriched: CatalogBookItem[] = db.books.map((book) => {
      const stock = computeStockSummary(book._id, db.copies);
      return {
        _id: book._id,
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        category: book.category,
        genre: book.genre,
        language: book.language,
        publisher: book.publisher,
        keywords: book.keywords,
        coverImageUrl: book.coverImageUrl,
        shelfReference: book.shelfReference,
        stockSummary: {
          totalCopies: stock.totalCopies,
          availableCopies: stock.availableCopies,
          borrowedCopies: stock.borrowedCopies,
          reservedCopies: stock.reservedCopies,
          isAvailableNow: stock.isAvailableNow,
        },
        _publishedYear: book.publishedYear ?? 0,
      };
    });

    if (q) {
      enriched = enriched.filter((b) => {
        const haystacks = [
          b.title,
          b.author,
          b.isbn,
          b.category,
          b.genre || '',
          ...b.keywords,
        ].map((v) => v.toLowerCase());
        return haystacks.some((h) => h.includes(q));
      });
    }

    if (categories.length > 0) {
      enriched = enriched.filter((b) =>
        categories.includes(b.category.toLowerCase()),
      );
    }

    if (genres.length > 0) {
      enriched = enriched.filter(
        (b) => b.genre && genres.includes(b.genre.toLowerCase()),
      );
    }

    if (languages.length > 0) {
      enriched = enriched.filter((b) =>
        languages.includes(b.language.toLowerCase()),
      );
    }

    if (availableNowParam === 'true' || stockParam === 'available') {
      enriched = enriched.filter((b) => b.stockSummary.availableCopies > 0);
    } else if (stockParam === 'unavailable') {
      enriched = enriched.filter((b) => b.stockSummary.availableCopies === 0);
    }

    if (sortBy === 'title') {
      enriched.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'publishedYear') {
      enriched.sort(
        (a, b) =>
          ((b as unknown as { _publishedYear: number })._publishedYear || 0) -
          ((a as unknown as { _publishedYear: number })._publishedYear || 0),
      );
    }

    const totalItems = enriched.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const safePage = Math.min(page, totalPages);
    const startIdx = (safePage - 1) * limit;
    const paginatedItems = enriched.slice(startIdx, startIdx + limit);

    return HttpResponse.json({
      success: true,
      data: {
        items: paginatedItems,
        pagination: {
          totalItems,
          currentPage: safePage,
          totalPages,
          limit,
        },
      },
    });
  }),

  // 4.3 GET /books/:id
  http.get(`${API_BASE}/books/:id`, async ({ params, request }) => {
    await delay(120);
    const idParam = String(params.id || '');
    const db = getMockDb();

    const book = db.books.find(
      (b) => b._id === idParam || b.isbn === idParam,
    );
    if (!book) {
      return errorResponse(
        404,
        'BOOK_NOT_FOUND',
        `No book matches identifier "${idParam}".`,
      );
    }

    const user = getAuthenticatedUser(request, db);
    const stock = computeStockSummary(book._id, db.copies);
    const bookCopies = db.copies.filter((c) => c.bookId === book._id);
    const bookLoans = db.loans.filter((l) => l.bookId === book._id);

    const copies: BookDetail['copies'] = bookCopies.map((c) => {
      const activeLoanRecord = db.loans.find(
        (l) => l.copyId === c._id && l.status === 'Active',
      );
      const activeHoldRecord = db.holds.find(
        (h) => h.copyId === c._id && h.status === 'Ready',
      );

      let displayLocation = c.homeLocation;
      if (c.state === 'Borrowed') {
        displayLocation = 'Currently with a reader';
      } else if (c.state === 'Reserved') {
        displayLocation =
          user && activeHoldRecord?.studentId === user._id
            ? 'Held for you at main library counter'
            : 'Reserved at library counter';
      }

      return {
        _id: c._id,
        copyCode: c.copyCode,
        homeLocation: c.homeLocation,
        state: c.state,
        condition: c.condition,
        displayLocation,
        activeLoan:
          user?.role === 'staff' && activeLoanRecord
            ? {
                borrowCode: activeLoanRecord.borrowCode,
                studentName: activeLoanRecord.studentName,
                studentAccountId: activeLoanRecord.studentAccountId,
                dueDate: activeLoanRecord.dueDate,
              }
            : null,
        activeHold:
          user?.role === 'staff' && activeHoldRecord
            ? {
                holdCode: activeHoldRecord.holdCode,
                studentName: activeHoldRecord.studentName,
                studentAccountId: activeHoldRecord.studentAccountId,
                collectBy: activeHoldRecord.collectBy,
              }
            : null,
        hasLoanHistory: c.hasLoanHistory,
      };
    });

    // Compute viewerContext for student role (or default Maya preview if viewing detail)
    let viewerContext: BookDetail['viewerContext'] = null;
    const studentUser =
      user?.role === 'student'
        ? user
        : db.users.find((u) => u.accountId === 'S10428')!;

    if (studentUser) {
      const syncedStudent = syncUserCounters(studentUser, db);
      const existingHold = db.holds.find(
        (h) =>
          h.studentId === syncedStudent._id &&
          h.bookId === book._id &&
          h.status === 'Ready',
      );
      const existingActiveLoan = db.loans.find(
        (l) =>
          l.studentId === syncedStudent._id &&
          l.bookId === book._id &&
          l.status === 'Active',
      );

      const hasOverdueOrFines =
        syncedStudent.overdueLoansCount > 0 || syncedStudent.unpaidFines > 0;
      const reachedLoanLimit =
        syncedStudent.activeLoansCount >= syncedStudent.maxLoansLimit;

      const canBorrow = !hasOverdueOrFines && !reachedLoanLimit;
      let canRequestHold = true;
      let blockReason: string | null = null;

      if (existingHold) {
        canRequestHold = false;
        blockReason = `You already have an active hold (${existingHold.holdCode}) on this book.`;
      } else if (existingActiveLoan) {
        canRequestHold = false;
        blockReason = `You are currently borrowing a copy of this book (${existingActiveLoan.copyCode}).`;
      } else if (hasOverdueOrFines) {
        canRequestHold = false;
        blockReason =
          'Borrowing and hold requests are blocked until overdue books or unpaid fines are resolved.';
      } else if (stock.availableCopies === 0) {
        canRequestHold = false;
        blockReason =
          'All physical copies are currently on loan or reserved.';
      }

      viewerContext = {
        canBorrow,
        canRequestHold,
        blockReason,
        activeLoansCount: syncedStudent.activeLoansCount,
        maxLoansLimit: syncedStudent.maxLoansLimit,
        existingHoldCode: existingHold ? existingHold.holdCode : null,
      };
    }

    const canDeleteTitle = stock.totalCopies === 0 && bookLoans.length === 0;

    const detail: BookDetail = {
      _id: book._id,
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      genre: book.genre,
      keywords: book.keywords,
      description: book.description,
      publisher: book.publisher,
      publishedYear: book.publishedYear,
      format: book.format,
      language: book.language,
      pageCount: book.pageCount,
      coverImageUrl: book.coverImageUrl,
      shelfReference: book.shelfReference,
      sectionName: book.sectionName,
      stockSummary: {
        totalCopies: stock.totalCopies,
        availableCopies: stock.availableCopies,
        borrowedCopies: stock.borrowedCopies,
        reservedCopies: stock.reservedCopies,
        damagedCopies: stock.damagedCopies,
        lostCopies: stock.lostCopies,
      },
      canDeleteTitle,
      deleteDisabledReason: canDeleteTitle
        ? null
        : 'Unavailable: this title has physical copies and loan history. Borrowed copies and historical loans cannot be deleted.',
      copies,
      viewerContext,
    };

    return HttpResponse.json({
      success: true,
      data: detail,
    });
  }),

  // 6.1 GET /me/borrowing
  http.get(`${API_BASE}/me/borrowing`, async ({ request }) => {
    await delay(130);
    const db = getMockDb();
    const user =
      getAuthenticatedUser(request, db) ||
      syncUserCounters(
        db.users.find((u) => u.accountId === 'S10428')!,
        db,
      );

    const today = getDemoToday();
    const studentLoans = db.loans.filter((l) => l.studentId === user._id);
    const activeLoans = studentLoans
      .filter((l) => l.status === 'Active')
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    const returnedLoans = studentLoans
      .filter((l) => l.status === 'Returned')
      .sort((a, b) => (b.returnedAt || '').localeCompare(a.returnedAt || ''));

    const currentLoans: CurrentLoanItem[] = activeLoans.map((loan) => {
      const book = db.books.find((b) => b._id === loan.bookId);
      const daysLeft = calculateDaysDifference(today, loan.dueDate);
      const isOverdue = daysLeft < 0;
      const otherStudentHoldOnTitle = db.holds.some(
        (h) =>
          h.bookId === loan.bookId &&
          h.studentId !== user._id &&
          h.status === 'Ready',
      );

      const canRenew =
        loan.renewalCount === 0 &&
        !isOverdue &&
        user.overdueLoansCount === 0 &&
        user.unpaidFines === 0 &&
        !otherStudentHoldOnTitle;

      let renewalStatusText =
        'Renewal available · Not yet renewed · Nobody is waiting';
      if (loan.renewalCount >= 1) {
        renewalStatusText = 'Renewed once · Maximum online renewals reached';
      } else if (isOverdue) {
        renewalStatusText =
          'Overdue · Return this copy to the library counter';
      } else if (user.overdueLoansCount > 0 || user.unpaidFines > 0) {
        renewalStatusText =
          'Renewal unavailable while account has overdue books or unpaid fines';
      }

      return {
        _id: loan._id,
        borrowCode: loan.borrowCode,
        copyCode: loan.copyCode,
        book: {
          _id: book?._id || loan.bookId,
          title: book?.title || 'Unknown Book',
          author: book?.author || 'Unknown Author',
          coverImageUrl: book?.coverImageUrl || null,
        },
        borrowedAt: loan.borrowedAt,
        dueDate: loan.dueDate,
        daysLeft,
        isOverdue,
        renewalCount: loan.renewalCount,
        canRenew,
        renewalStatusText,
        newDueDatePreview: canRenew ? addDaysToIsoDate(loan.dueDate, 7) : null,
      };
    });

    const activeHolds = db.holds.filter(
      (h) => h.studentId === user._id && h.status === 'Ready',
    );

    const holdRequests: HoldRequestItem[] = activeHolds.map((hold) => {
      const book = db.books.find((b) => b._id === hold.bookId);
      const copy = db.copies.find((c) => c._id === hold.copyId);
      return {
        _id: hold._id,
        holdCode: hold.holdCode,
        status: hold.status,
        requestedAt: hold.requestedAt,
        collectBy: hold.collectBy,
        pickupLocation: hold.pickupLocation,
        book: {
          _id: book?._id || hold.bookId,
          title: book?.title || 'Unknown Book',
          author: book?.author || 'Unknown Author',
          format: book?.format || 'Paperback',
          coverImageUrl: book?.coverImageUrl || null,
        },
        copy: {
          _id: copy?._id || hold.copyId,
          copyCode: copy?.copyCode || hold.copyCode,
          homeLocation: copy?.homeLocation || book?.shelfReference || 'Main library',
        },
      };
    });

    const canBorrow =
      user.overdueLoansCount === 0 &&
      user.unpaidFines === 0 &&
      user.activeLoansCount < user.maxLoansLimit;

    const dashboard: MyBorrowingDashboard = {
      accountSummary: {
        canBorrow,
        statusText: canBorrow
          ? 'You can borrow'
          : user.overdueLoansCount > 0
            ? 'Overdue book must be returned'
            : 'Loan limit reached',
        activeLoansCount: user.activeLoansCount,
        maxLoansLimit: user.maxLoansLimit,
        remainingLoanSpace: Math.max(0, user.maxLoansLimit - user.activeLoansCount),
        overdueBooksCount: user.overdueLoansCount,
        unpaidFines: user.unpaidFines,
      },
      currentLoans,
      holdRequests,
      borrowingHistory: returnedLoans.map((loan) => {
        const book = db.books.find((b) => b._id === loan.bookId);
        return {
          _id: loan._id,
          borrowCode: loan.borrowCode,
          copyCode: loan.copyCode,
          book: {
            _id: book?._id || loan.bookId,
            title: book?.title || 'Unknown Book',
            author: book?.author || 'Unknown Author',
            coverImageUrl: book?.coverImageUrl || null,
          },
          borrowedAt: loan.borrowedAt,
          dueDate: loan.dueDate,
          returnedAt: loan.returnedAt || today,
          returnCondition: loan.returnCondition || 'Good',
        };
      }),
    };

    return HttpResponse.json({
      success: true,
      data: dashboard,
    });
  }),

  // 6.2 POST /holds
  http.post(`${API_BASE}/holds`, async ({ request }) => {
    await delay(160);
    const db = getMockDb();
    const user =
      getAuthenticatedUser(request, db) ||
      syncUserCounters(
        db.users.find((u) => u.accountId === 'S10428')!,
        db,
      );

    let body: { bookId?: string } = {};
    try {
      body = (await request.json()) as { bookId?: string };
    } catch {
      return errorResponse(400, 'INVALID_INPUT', 'bookId is required.');
    }

    const bookId = body.bookId?.trim();
    if (!bookId) {
      return errorResponse(400, 'INVALID_INPUT', 'bookId is required.');
    }

    const book = db.books.find((b) => b._id === bookId || b.isbn === bookId);
    if (!book) {
      return errorResponse(404, 'BOOK_NOT_FOUND', 'Book title not found.');
    }

    // Rule 1: Student must have no overdue books and no unpaid fines
    if (user.overdueLoansCount > 0 || user.unpaidFines > 0) {
      return errorResponse(
        403,
        'BORROWING_BLOCKED',
        'You cannot place a hold while you have overdue books or unpaid fines.',
      );
    }

    // Rule 2: Student cannot already have an active loan or active hold for the same book title
    const existingHold = db.holds.find(
      (h) =>
        h.studentId === user._id &&
        h.bookId === book._id &&
        h.status === 'Ready',
    );
    const existingLoan = db.loans.find(
      (l) =>
        l.studentId === user._id &&
        l.bookId === book._id &&
        l.status === 'Active',
    );
    if (existingHold || existingLoan) {
      return errorResponse(
        409,
        'DUPLICATE_HOLD_OR_LOAN',
        existingHold
          ? `You already have an active hold (${existingHold.holdCode}) on this book.`
          : 'You already have an active loan for this book.',
      );
    }

    // Rule 3: At least 1 physical copy of the book must have state === "Available"
    const availableCopy = db.copies.find(
      (c) => c.bookId === book._id && c.state === 'Available',
    );
    if (!availableCopy) {
      return errorResponse(
        400,
        'NO_AVAILABLE_COPIES',
        'All physical copies are currently unavailable.',
      );
    }

    // Rule 4: Reserve copy, generate holdCode, set collectBy to next day 15:30
    availableCopy.state = 'Reserved';
    availableCopy.updatedAt = '2026-10-15T10:15:00Z';

    const holdCode = `HLD-${db.nextHoldSeq++}`;
    const newHold = {
      _id: `hold-${holdCode.toLowerCase()}`,
      holdCode,
      studentId: user._id,
      studentAccountId: user.accountId,
      studentName: user.fullName,
      bookId: book._id,
      copyId: availableCopy._id,
      copyCode: availableCopy.copyCode,
      status: 'Ready' as const,
      requestedAt: '2026-10-15T10:15:00Z',
      collectBy: '2026-10-16T15:30:00Z',
      pickupLocation: 'Main library counter',
    };

    db.holds.push(newHold);
    saveMockDb(db);

    const updatedStock = computeStockSummary(book._id, db.copies);

    const confirmation: HoldConfirmation = {
      _id: newHold._id,
      holdCode: newHold.holdCode,
      status: newHold.status,
      requestedAt: newHold.requestedAt,
      collectBy: newHold.collectBy,
      book: {
        _id: book._id,
        title: book.title,
        author: book.author,
        format: book.format,
        shelfReference: book.shelfReference,
        coverImageUrl: book.coverImageUrl,
        stockSummary: {
          totalCopies: updatedStock.totalCopies,
          availableCopies: updatedStock.availableCopies,
          borrowedCopies: updatedStock.borrowedCopies,
          reservedCopies: updatedStock.reservedCopies,
        },
      },
      assignedCopy: {
        _id: availableCopy._id,
        copyCode: availableCopy.copyCode,
        homeLocation: availableCopy.homeLocation,
      },
      studentLoanUsage: {
        activeLoansCount: user.activeLoansCount,
        maxLoansLimit: user.maxLoansLimit,
      },
    };

    return HttpResponse.json(
      {
        success: true,
        data: confirmation,
      },
      { status: 201 },
    );
  }),

  // 6.3 DELETE /holds/:id
  http.delete(`${API_BASE}/holds/:id`, async ({ params }) => {
    await delay(140);
    const idParam = String(params.id || '');
    const db = getMockDb();

    const hold = db.holds.find(
      (h) =>
        h._id === idParam ||
        h.holdCode.toLowerCase() === idParam.toLowerCase(),
    );

    if (!hold) {
      return errorResponse(404, 'HOLD_NOT_FOUND', 'Hold request not found.');
    }

    if (hold.status !== 'Ready') {
      return errorResponse(
        409,
        'HOLD_NOT_CANCELLABLE',
        'Hold is already fulfilled or cancelled.',
      );
    }

    hold.status = 'Cancelled';
    const copy = db.copies.find((c) => c._id === hold.copyId);
    if (copy && copy.state === 'Reserved') {
      copy.state = 'Available';
      copy.updatedAt = new Date().toISOString();
    }

    saveMockDb(db);

    return HttpResponse.json({
      success: true,
      message: `Hold ${hold.holdCode} has been cancelled and the copy is now available.`,
      data: {
        holdCode: hold.holdCode,
        status: 'Cancelled',
        releasedCopyCode: hold.copyCode,
      },
    });
  }),

  // 6.4 POST /loans/:id/renew
  http.post(`${API_BASE}/loans/:id/renew`, async ({ params, request }) => {
    await delay(140);
    const idParam = String(params.id || '');
    const db = getMockDb();
    const user =
      getAuthenticatedUser(request, db) ||
      syncUserCounters(
        db.users.find((u) => u.accountId === 'S10428')!,
        db,
      );

    const loan = db.loans.find(
      (l) =>
        l._id === idParam ||
        l.borrowCode.toLowerCase() === idParam.toLowerCase(),
    );

    if (!loan) {
      return errorResponse(404, 'LOAN_NOT_FOUND', 'Loan record not found.');
    }

    const today = getDemoToday();
    const currentDaysLeft = calculateDaysDifference(today, loan.dueDate);

    if (
      loan.status !== 'Active' ||
      loan.renewalCount >= 1 ||
      currentDaysLeft < 0 ||
      user.overdueLoansCount > 0 ||
      user.unpaidFines > 0
    ) {
      return errorResponse(
        403,
        'RENEWAL_NOT_ELIGIBLE',
        'This loan cannot be renewed (already renewed once, overdue, or account blocked).',
      );
    }

    const previousDueDate = loan.dueDate;
    const newDueDate = addDaysToIsoDate(previousDueDate, 7);
    loan.dueDate = newDueDate;
    loan.renewalCount = 1;

    saveMockDb(db);

    const newDaysLeft = calculateDaysDifference(today, newDueDate);

    return HttpResponse.json({
      success: true,
      message: 'Loan renewed for 7 days',
      data: {
        _id: loan._id,
        borrowCode: loan.borrowCode,
        previousDueDate,
        newDueDate,
        daysLeft: newDaysLeft,
        renewalCount: 1,
        canRenew: false,
      },
    });
  }),
];
