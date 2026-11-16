import { delay, http, HttpResponse } from 'msw';
import { AUTH_USER_KEY } from '../api/client';
import {
  AddCopyRequestBody,
  Book,
  BookCategory,
  CopyCondition,
  CreateBookRequestBody,
  PhysicalCopy,
  UpdateBookRequestBody,
  UpdateCopyRequestBody,
} from '../types/api';
import { computeStockSummary, getMockDb, saveMockDb } from './db';

const API_BASE = '/api/v1';

const VALID_CATEGORIES: BookCategory[] = [
  'Fiction',
  'Non-fiction',
  'Poetry',
  'Graphic novels',
  'Reference',
];

const VALID_CONDITIONS: CopyCondition[] = ['Good', 'Damaged', 'Lost'];
const VALID_EDITABLE_STATES = ['Available', 'Damaged', 'Lost'] as const;

function errorResponse(status: number, code: string, message: string) {
  return HttpResponse.json(
    {
      success: false,
      error: { code, message },
    },
    { status },
  );
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
    // ignore storage read errors
  }
  return false;
}

export const inventoryHandlers = [
  // 4.4 POST /books
  http.post(`${API_BASE}/books`, async ({ request, cookies }) => {
    await delay(140);
    if (!isStaffAllowed(cookies)) {
      return errorResponse(403, 'FORBIDDEN_ACCESS', 'Staff access required.');
    }

    const body = (await request.json().catch(() => ({}))) as Partial<CreateBookRequestBody>;
    const title = body.title?.trim() || '';
    const author = body.author?.trim() || '';
    const isbn = body.isbn?.trim() || '';
    const category = body.category as BookCategory;

    if (!title || !author || !isbn || !VALID_CATEGORIES.includes(category)) {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        'Title, author, ISBN, and a valid category are required.',
      );
    }

    const db = getMockDb();
    if (db.books.some((b) => b.isbn.toLowerCase() === isbn.toLowerCase())) {
      return errorResponse(
        409,
        'DUPLICATE_ISBN',
        'A book title with this ISBN already exists.',
      );
    }

    const now = new Date().toISOString();
    const keywords = Array.isArray(body.keywords)
      ? body.keywords.map((k) => String(k).trim()).filter(Boolean)
      : [];

    const newBook: Omit<Book, 'stockSummary'> = {
      _id: `book_${Date.now()}`,
      title,
      author,
      isbn,
      category,
      genre: body.genre?.trim() || category,
      keywords,
      publisher: body.publisher?.trim() || null,
      publishedYear: body.publishedYear ?? new Date().getFullYear(),
      language: body.language || 'English',
      format: body.format?.trim() || 'Paperback',
      pageCount: body.pageCount ?? null,
      description:
        body.description?.trim() ||
        `${title} by ${author}, catalogued under ${category} at Westbridge School Library.`,
      coverImageUrl: body.coverImageUrl ?? null,
      shelfReference: body.shelfReference?.trim() || null,
      sectionName: `${category} Section`,
      createdAt: now,
      updatedAt: now,
    };

    db.books.unshift(newBook);
    saveMockDb(db);

    const stockSummary = computeStockSummary(newBook._id, db.copies);
    return HttpResponse.json(
      {
        success: true,
        data: {
          ...newBook,
          stockSummary,
        },
      },
      { status: 201 },
    );
  }),

  // 4.5 PUT /books/:id
  http.put(`${API_BASE}/books/:id`, async ({ params, request, cookies }) => {
    await delay(140);
    if (!isStaffAllowed(cookies)) {
      return errorResponse(403, 'FORBIDDEN_ACCESS', 'Staff access required.');
    }

    const idParam = String(params.id || '');
    const db = getMockDb();
    const book = db.books.find(
      (b) => b._id === idParam || b.isbn === idParam,
    );
    if (!book) {
      return errorResponse(404, 'BOOK_NOT_FOUND', 'Book title not found.');
    }

    const body = (await request.json().catch(() => ({}))) as Partial<UpdateBookRequestBody>;
    const title = body.title?.trim() || '';
    const author = body.author?.trim() || '';
    const isbn = body.isbn?.trim() || '';
    const category = body.category as BookCategory;

    if (!title || !author || !isbn || !VALID_CATEGORIES.includes(category)) {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        'Title, author, ISBN, and a valid category are required.',
      );
    }

    if (
      db.books.some(
        (b) =>
          b._id !== book._id && b.isbn.toLowerCase() === isbn.toLowerCase(),
      )
    ) {
      return errorResponse(
        409,
        'DUPLICATE_ISBN',
        'A book title with this ISBN already exists.',
      );
    }

    book.title = title;
    book.author = author;
    book.isbn = isbn;
    book.category = category;
    if (body.publisher !== undefined) {
      book.publisher = body.publisher?.trim() || null;
    }
    if (body.keywords !== undefined) {
      book.keywords = Array.isArray(body.keywords)
        ? body.keywords.map((k) => String(k).trim()).filter(Boolean)
        : [];
    }
    if (body.genre !== undefined) {
      book.genre = body.genre?.trim() || category;
    }
    if (body.shelfReference !== undefined) {
      book.shelfReference = body.shelfReference?.trim() || null;
    }
    book.updatedAt = new Date().toISOString();
    saveMockDb(db);

    const stockSummary = computeStockSummary(book._id, db.copies);
    return HttpResponse.json({
      success: true,
      data: {
        ...book,
        stockSummary,
      },
    });
  }),

  // 4.6 DELETE /books/:id
  http.delete(`${API_BASE}/books/:id`, async ({ params, cookies }) => {
    await delay(140);
    if (!isStaffAllowed(cookies)) {
      return errorResponse(403, 'FORBIDDEN_ACCESS', 'Staff access required.');
    }

    const idParam = String(params.id || '');
    const db = getMockDb();
    const index = db.books.findIndex(
      (b) => b._id === idParam || b.isbn === idParam,
    );
    if (index === -1) {
      return errorResponse(404, 'BOOK_NOT_FOUND', 'Book title not found.');
    }

    const book = db.books[index];
    const hasCopies = db.copies.some((c) => c.bookId === book._id);
    const hasLoans = db.loans.some((l) => l.bookId === book._id);
    const hasHolds = db.holds.some((h) => h.bookId === book._id);

    if (hasCopies || hasLoans || hasHolds) {
      return errorResponse(
        409,
        'BOOK_HAS_COPIES_OR_HISTORY',
        'Unavailable: this title has physical copies and loan history. Borrowed copies and historical loans cannot be deleted.',
      );
    }

    db.books.splice(index, 1);
    db.featuredBookIds = db.featuredBookIds.filter((id) => id !== book._id);
    saveMockDb(db);

    return HttpResponse.json({
      success: true,
      message: 'Book title deleted successfully',
      data: null,
    });
  }),

  // 5.1 POST /books/:bookId/copies
  http.post(
    `${API_BASE}/books/:bookId/copies`,
    async ({ params, request, cookies }) => {
      await delay(140);
      if (!isStaffAllowed(cookies)) {
        return errorResponse(403, 'FORBIDDEN_ACCESS', 'Staff access required.');
      }

      const bookIdParam = String(params.bookId || '');
      const db = getMockDb();
      const book = db.books.find(
        (b) => b._id === bookIdParam || b.isbn === bookIdParam,
      );
      if (!book) {
        return errorResponse(404, 'BOOK_NOT_FOUND', 'Book title not found.');
      }

      const body = (await request.json().catch(() => ({}))) as Partial<AddCopyRequestBody>;
      const copyCode = body.copyCode?.trim() || '';
      const homeLocation = body.homeLocation?.trim() || '';
      const initialState = (body.initialState || 'Available') as PhysicalCopy['state'];
      const condition = (body.condition || 'Good') as CopyCondition;

      if (
        !copyCode ||
        !homeLocation ||
        !VALID_EDITABLE_STATES.includes(
          initialState as (typeof VALID_EDITABLE_STATES)[number],
        ) ||
        !VALID_CONDITIONS.includes(condition)
      ) {
        return errorResponse(
          400,
          'VALIDATION_ERROR',
          'Unique copy ID, home location, initial state, and condition are required.',
        );
      }

      if (
        db.copies.some(
          (c) => c.copyCode.toLowerCase() === copyCode.toLowerCase(),
        )
      ) {
        return errorResponse(
          409,
          'DUPLICATE_COPY_CODE',
          'Copy ID / barcode must be unique across the library.',
        );
      }

      const now = new Date().toISOString();
      const newCopy: PhysicalCopy = {
        _id: `copy_${Date.now()}`,
        copyCode,
        bookId: book._id,
        homeLocation,
        state: initialState,
        condition,
        notes: body.notes?.trim() || null,
        hasLoanHistory: false,
        createdAt: now,
        updatedAt: now,
      };

      db.copies.push(newCopy);
      if (!book.shelfReference) {
        book.shelfReference = homeLocation;
      }
      book.updatedAt = now;
      saveMockDb(db);

      const stock = computeStockSummary(book._id, db.copies);
      return HttpResponse.json(
        {
          success: true,
          data: {
            copy: newCopy,
            updatedStockSummary: {
              totalCopies: stock.totalCopies,
              availableCopies: stock.availableCopies,
              borrowedCopies: stock.borrowedCopies,
            },
          },
        },
        { status: 201 },
      );
    },
  ),

  // 5.2 PUT /copies/:id
  http.put(`${API_BASE}/copies/:id`, async ({ params, request, cookies }) => {
    await delay(140);
    if (!isStaffAllowed(cookies)) {
      return errorResponse(403, 'FORBIDDEN_ACCESS', 'Staff access required.');
    }

    const idParam = String(params.id || '');
    const db = getMockDb();
    const copy = db.copies.find(
      (c) =>
        c._id === idParam ||
        c.copyCode.toLowerCase() === idParam.toLowerCase(),
    );
    if (!copy) {
      return errorResponse(404, 'COPY_NOT_FOUND', 'Physical copy not found.');
    }

    const body = (await request.json().catch(() => ({}))) as Partial<UpdateCopyRequestBody>;
    const homeLocation = body.homeLocation?.trim() || '';
    const nextState = body.state as PhysicalCopy['state'];
    const condition = body.condition as CopyCondition;

    if (
      !homeLocation ||
      !VALID_EDITABLE_STATES.includes(
        nextState as (typeof VALID_EDITABLE_STATES)[number],
      ) ||
      !VALID_CONDITIONS.includes(condition)
    ) {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        'Home location, state, and condition are required.',
      );
    }

    const hasActiveLoan = db.loans.some(
      (l) => l.copyId === copy._id && l.status === 'Active',
    );
    const hasActiveHold = db.holds.some(
      (h) => h.copyId === copy._id && h.status === 'Ready',
    );

    if (
      (copy.state === 'Borrowed' ||
        copy.state === 'Reserved' ||
        hasActiveLoan ||
        hasActiveHold) &&
      nextState !== copy.state
    ) {
      return errorResponse(
        409,
        'COPY_HAS_ACTIVE_LOAN_OR_HOLD',
        "Complete the return or cancel the hold before changing a borrowed/reserved copy's state.",
      );
    }

    copy.homeLocation = homeLocation;
    copy.state = nextState;
    copy.condition = condition;
    if (body.notes !== undefined) {
      copy.notes = body.notes?.trim() || null;
    }
    copy.updatedAt = new Date().toISOString();
    saveMockDb(db);

    const stock = computeStockSummary(copy.bookId, db.copies);
    return HttpResponse.json({
      success: true,
      data: {
        copy,
        updatedStockSummary: {
          totalCopies: stock.totalCopies,
          availableCopies: stock.availableCopies,
          borrowedCopies: stock.borrowedCopies,
          reservedCopies: stock.reservedCopies,
          damagedCopies: stock.damagedCopies,
          lostCopies: stock.lostCopies,
        },
      },
    });
  }),

  // 5.3 DELETE /copies/:id
  http.delete(`${API_BASE}/copies/:id`, async ({ params, cookies }) => {
    await delay(140);
    if (!isStaffAllowed(cookies)) {
      return errorResponse(403, 'FORBIDDEN_ACCESS', 'Staff access required.');
    }

    const idParam = String(params.id || '');
    const db = getMockDb();
    const index = db.copies.findIndex(
      (c) =>
        c._id === idParam ||
        c.copyCode.toLowerCase() === idParam.toLowerCase(),
    );
    if (index === -1) {
      return errorResponse(404, 'COPY_NOT_FOUND', 'Physical copy not found.');
    }

    const copy = db.copies[index];
    const hasLoans =
      copy.hasLoanHistory || db.loans.some((l) => l.copyId === copy._id);
    const hasActiveHold = db.holds.some(
      (h) => h.copyId === copy._id && h.status === 'Ready',
    );

    if (
      copy.state === 'Borrowed' ||
      copy.state === 'Reserved' ||
      hasLoans ||
      hasActiveHold
    ) {
      return errorResponse(
        409,
        'COPY_HAS_LOAN_HISTORY',
        'Deletion disabled: this copy has loan history. Use Damaged or Lost to make a copy unavailable; keep its records.',
      );
    }

    db.copies.splice(index, 1);
    saveMockDb(db);

    return HttpResponse.json({
      success: true,
      message: 'Physical copy deleted successfully',
      data: null,
    });
  }),
];
