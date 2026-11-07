import {
  Book,
  CopyCondition,
  CopyState,
  HoldStatus,
  LoanStatus,
  PhysicalCopy,
  StockSummary,
  User,
} from '../types/api';

export interface MockUserRecord extends User {
  password: string;
}

export interface MockLoanRecord {
  _id: string;
  borrowCode: string;
  studentId: string;
  studentAccountId: string;
  studentName: string;
  bookId: string;
  copyId: string;
  copyCode: string;
  borrowedAt: string;
  dueDate: string;
  returnedAt: string | null;
  returnCondition: CopyCondition | null;
  conditionNote: string | null;
  status: LoanStatus;
  renewalCount: number;
}

export interface MockHoldRecord {
  _id: string;
  holdCode: string;
  studentId: string;
  studentAccountId: string;
  studentName: string;
  bookId: string;
  copyId: string;
  copyCode: string;
  status: HoldStatus;
  requestedAt: string;
  collectBy: string;
  pickupLocation: string;
}

export interface MockDatabase {
  users: MockUserRecord[];
  books: Omit<Book, 'stockSummary'>[];
  copies: PhysicalCopy[];
  loans: MockLoanRecord[];
  holds: MockHoldRecord[];
  nextHoldSeq: number;
  nextBorrowSeq: number;
  featuredBookIds: string[];
}

const STORAGE_KEY = 'bookborrow_mock_db_v1';
const DEMO_TODAY = '2026-10-15';

export function computeStockSummary(
  bookId: string,
  copies: PhysicalCopy[],
): StockSummary {
  const bookCopies = copies.filter((c) => c.bookId === bookId);
  const availableCopies = bookCopies.filter((c) => c.state === 'Available').length;
  const borrowedCopies = bookCopies.filter((c) => c.state === 'Borrowed').length;
  const reservedCopies = bookCopies.filter((c) => c.state === 'Reserved').length;
  const damagedCopies = bookCopies.filter((c) => c.state === 'Damaged').length;
  const lostCopies = bookCopies.filter((c) => c.state === 'Lost').length;

  return {
    totalCopies: bookCopies.length,
    availableCopies,
    borrowedCopies,
    reservedCopies,
    damagedCopies,
    lostCopies,
    isAvailableNow: availableCopies > 0,
  };
}

export function calculateDaysDifference(fromIsoDate: string, toIsoDate: string): number {
  const from = new Date(`${fromIsoDate.slice(0, 10)}T00:00:00Z`).getTime();
  const to = new Date(`${toIsoDate.slice(0, 10)}T00:00:00Z`).getTime();
  return Math.round((to - from) / (1000 * 60 * 60 * 24));
}

export function addDaysToIsoDate(isoDate: string, days: number): string {
  const d = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function createInitialSeedDatabase(): MockDatabase {
  const users: MockUserRecord[] = [
    {
      _id: '671a9b2c8f1b2c0015a4e901',
      accountId: 'S10428',
      fullName: 'Maya Chen',
      initials: 'MC',
      role: 'student',
      status: 'Active',
      yearGroup: 'Year 10',
      activeLoansCount: 2,
      maxLoansLimit: 5,
      overdueLoansCount: 0,
      unpaidFines: 0.0,
      hasBorrowingHistory: true,
      password: 'password123',
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-10-15T08:00:00Z',
    },
    {
      _id: '671a9b2c8f1b2c0015a4e902',
      accountId: 'S10312',
      fullName: 'Oliver Brown',
      initials: 'OB',
      role: 'student',
      status: 'Active',
      yearGroup: 'Year 11',
      activeLoansCount: 1,
      maxLoansLimit: 5,
      overdueLoansCount: 1,
      unpaidFines: 0.0,
      hasBorrowingHistory: true,
      password: 'password123',
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-10-15T08:00:00Z',
    },
    {
      _id: '671a9b2c8f1b2c0015a4e903',
      accountId: 'S10216',
      fullName: 'Amira Khan',
      initials: 'AK',
      role: 'student',
      status: 'Active',
      yearGroup: 'Year 10',
      activeLoansCount: 1,
      maxLoansLimit: 5,
      overdueLoansCount: 0,
      unpaidFines: 0.0,
      hasBorrowingHistory: true,
      password: 'password123',
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-10-15T08:00:00Z',
    },
    {
      _id: '671a9b2c8f1b2c0015a4e904',
      accountId: 'S10999',
      fullName: 'Liam Patel',
      initials: 'LP',
      role: 'student',
      status: 'Inactive',
      yearGroup: 'Year 12',
      activeLoansCount: 0,
      maxLoansLimit: 5,
      overdueLoansCount: 0,
      unpaidFines: 0.0,
      hasBorrowingHistory: false,
      password: 'password123',
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-10-15T08:00:00Z',
    },
    {
      _id: '671a9b2c8f1b2c0015a4e905',
      accountId: 'STF001',
      fullName: 'Eleanor Vance',
      initials: 'EV',
      role: 'staff',
      status: 'Active',
      yearGroup: null,
      activeLoansCount: 0,
      maxLoansLimit: 5,
      overdueLoansCount: 0,
      unpaidFines: 0.0,
      hasBorrowingHistory: false,
      password: 'password123',
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-10-15T08:00:00Z',
    },
    {
      _id: '671a9b2c8f1b2c0015a4e906',
      accountId: 'ADM001',
      fullName: 'Arthur Pendelton',
      initials: 'AP',
      role: 'admin',
      status: 'Active',
      yearGroup: null,
      activeLoansCount: 0,
      maxLoansLimit: 5,
      overdueLoansCount: 0,
      unpaidFines: 0.0,
      hasBorrowingHistory: false,
      password: 'password123',
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-10-15T08:00:00Z',
    },
  ];

  const books: Omit<Book, 'stockSummary'>[] = [
    {
      _id: 'book-midnight-library',
      title: 'The Midnight Library',
      author: 'Matt Haig',
      isbn: '9781786892737',
      category: 'Fiction',
      genre: 'Contemporary fiction',
      keywords: ['Choices & possibilities', 'Fantasy', 'Contemporary', 'fiction'],
      publisher: 'Canongate Books',
      publishedYear: 2020,
      language: 'English',
      format: 'Paperback',
      pageCount: 304,
      description:
        'Between life and death is a library filled with books. Each one offers Nora Seed a chance to try a different life, undo a regret and discover what truly makes a life worth living.\n\nA thoughtful novel about second chances, the paths we take and the possibilities we leave behind.',
      coverImageUrl: null,
      shelfReference: 'FIC HAI · A3',
      sectionName: 'Fiction section · Main library',
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-10-15T08:00:00Z',
    },
    {
      _id: 'book-book-thief',
      title: 'The Book Thief',
      author: 'Markus Zusak',
      isbn: '9780375842207',
      category: 'Fiction',
      genre: 'Historical fiction',
      keywords: ['History', 'World War II', 'Words & courage', 'fiction'],
      publisher: 'Knopf Books',
      publishedYear: 2005,
      language: 'English',
      format: 'Paperback',
      pageCount: 552,
      description:
        'Set in 1939 Germany, Liesel Meminger fosters a deep love of books by rescuing stories from being lost and sharing them with her neighbors and the young man hidden in her basement.\n\nAn unforgettable story about the resilience of kindness and the quiet power of words.',
      coverImageUrl: null,
      shelfReference: 'FIC ZUS · A5',
      sectionName: 'Fiction section · Main library',
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-10-15T08:00:00Z',
    },
    {
      _id: 'book-hobbit',
      title: 'The Hobbit',
      author: 'J.R.R. Tolkien',
      isbn: '9780261103344',
      category: 'Fiction',
      genre: 'Fantasy',
      keywords: ['Adventure', 'Middle-earth', 'Quest', 'fiction'],
      publisher: 'HarperCollins',
      publishedYear: 1937,
      language: 'English',
      format: 'Paperback',
      pageCount: 310,
      description:
        'Bilbo Baggins enjoys a quiet, comfortable life in his hobbit-hole until the wizard Gandalf and a company of dwarves sweep him away on an epic journey to the Lonely Mountain.\n\nA timeless fantasy classic about unexpected bravery and discovery.',
      coverImageUrl: null,
      shelfReference: 'FIC TOL · A4',
      sectionName: 'Fiction section · Main library',
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-10-15T08:00:00Z',
    },
    {
      _id: 'book-mango-street',
      title: 'The House on Mango Street',
      author: 'Sandra Cisneros',
      isbn: '9780679734772',
      category: 'Fiction',
      genre: 'Contemporary fiction',
      keywords: ['Coming of age', 'Community', 'Identity', 'fiction'],
      publisher: 'Vintage Contemporaries',
      publishedYear: 1984,
      language: 'English',
      format: 'Paperback',
      pageCount: 110,
      description:
        'Told through a series of vivid vignettes, Esperanza Cordero grows up in a lively Chicago neighborhood, observing the hopes, struggles and dreams of those around her while finding her own voice as a writer.',
      coverImageUrl: null,
      shelfReference: 'FIC CIS · A2',
      sectionName: 'Fiction section · Main library',
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-10-15T08:00:00Z',
    },
    {
      _id: 'book-wrinkle-in-time',
      title: 'A Wrinkle in Time',
      author: "Madeleine L'Engle",
      isbn: '9780312367541',
      category: 'Fiction',
      genre: 'Science fiction',
      keywords: ['Space & time', 'Science', 'Family', 'fiction'],
      publisher: 'Square Fish',
      publishedYear: 1962,
      language: 'English',
      format: 'Paperback',
      pageCount: 256,
      description:
        'Meg Murry, her brilliant younger brother Charles Wallace, and their friend Calvin travel across space and dimensions through a tesseract to rescue Meg’s scientist father.',
      coverImageUrl: null,
      shelfReference: 'FIC LEN · A3',
      sectionName: 'Fiction section · Main library',
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-10-15T08:00:00Z',
    },
    {
      _id: 'book-the-giver',
      title: 'The Giver',
      author: 'Lois Lowry',
      isbn: '9780544336261',
      category: 'Fiction',
      genre: 'Science fiction',
      keywords: ['Memory', 'Dystopian', 'Society', 'fiction'],
      publisher: 'Clarion Books',
      publishedYear: 1993,
      language: 'English',
      format: 'Paperback',
      pageCount: 240,
      description:
        'Twelve-year-old Jonas lives in a seemingly ideal, painless world until he is chosen to inherit the position of Receiver of Memory—the sole keeper of the community’s true past.',
      coverImageUrl: null,
      shelfReference: 'FIC LOW · A3',
      sectionName: 'Fiction section · Main library',
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-10-15T08:00:00Z',
    },
    {
      _id: 'book-brief-history',
      title: 'A Brief History of Time',
      author: 'Stephen Hawking',
      isbn: '9780553380163',
      category: 'Non-fiction',
      genre: 'Science',
      keywords: ['Science', 'Cosmology', 'Universe', 'Physics'],
      publisher: 'Bantam Books',
      publishedYear: 1988,
      language: 'English',
      format: 'Paperback',
      pageCount: 212,
      description:
        'A landmark exploration of the universe—from the Big Bang to black holes, light cones and the nature of time—written for curious general readers.',
      coverImageUrl: null,
      shelfReference: 'SCI HAW · B2',
      sectionName: 'Science & Non-fiction · Main library',
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-10-15T08:00:00Z',
    },
    {
      _id: 'book-wonder',
      title: 'Wonder',
      author: 'R.J. Palacio',
      isbn: '9780375869020',
      category: 'Graphic novels',
      genre: 'Contemporary fiction',
      keywords: ['Kindness', 'Empathy', 'School life'],
      publisher: 'Alfred A. Knopf',
      publishedYear: 2012,
      language: 'English',
      format: 'Paperback',
      pageCount: 315,
      description:
        'August Pullman was born with a facial difference that prevented him from going to a mainstream school—until now, as he starts 5th grade at Beecher Prep.',
      coverImageUrl: null,
      shelfReference: 'FIC PAL · A2',
      sectionName: 'Main library',
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-10-15T08:00:00Z',
    },
    {
      _id: 'book-poetry-anthology',
      title: 'Devotions: Selected Poems',
      author: 'Mary Oliver',
      isbn: '9780399563249',
      category: 'Poetry',
      genre: null,
      keywords: ['Nature', 'Mindfulness', 'Verse'],
      publisher: 'Penguin Press',
      publishedYear: 2017,
      language: 'English',
      format: 'Hardcover',
      pageCount: 464,
      description:
        'A curated collection spanning five decades of Mary Oliver’s observations of the natural world, wonder, and quiet reflection.',
      coverImageUrl: null,
      shelfReference: 'POE OLI · C1',
      sectionName: 'Poetry section · Main library',
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-10-15T08:00:00Z',
    },
    {
      _id: 'book-vietnamese-classic',
      title: 'Dế Mèn Phiêu Lưu Ký',
      author: 'Tô Hoài',
      isbn: '9786042188241',
      category: 'Reference',
      genre: 'Historical fiction',
      keywords: ['Vietnamese literature', 'Adventure', 'History'],
      publisher: 'NXB Kim Đồng',
      publishedYear: 1941,
      language: 'Vietnamese',
      format: 'Paperback',
      pageCount: 196,
      description:
        'A beloved Vietnamese literary classic chronicling the adventures and life lessons of a young cricket exploring the wider world.',
      coverImageUrl: null,
      shelfReference: 'VIE TOH · D1',
      sectionName: 'World Languages & Reference · Main library',
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-10-15T08:00:00Z',
    },
  ];

  const makeCopy = (
    id: string,
    copyCode: string,
    bookId: string,
    homeLocation: string,
    state: CopyState,
    hasLoanHistory = true,
  ): PhysicalCopy => ({
    _id: id,
    copyCode,
    bookId,
    homeLocation,
    state,
    condition: 'Good',
    notes: null,
    hasLoanHistory,
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-10-15T08:00:00Z',
  });

  const copies: PhysicalCopy[] = [
    // The Midnight Library (4 copies: 2 Available, 2 Borrowed — matching Figma 6:2440)
    makeCopy('copy-421', 'WB-00421', 'book-midnight-library', 'FIC HAI · A3', 'Available'),
    makeCopy('copy-422', 'WB-00422', 'book-midnight-library', 'FIC HAI · A3', 'Available'),
    makeCopy('copy-423', 'WB-00423', 'book-midnight-library', 'FIC HAI · A3', 'Borrowed'),
    makeCopy('copy-424', 'WB-00424', 'book-midnight-library', 'FIC HAI · A3', 'Borrowed'),

    // The Book Thief (3 copies: 1 Available, 2 Borrowed — matching Figma 6:2206)
    makeCopy('copy-101', 'WB-00101', 'book-book-thief', 'FIC ZUS · A5', 'Available'),
    makeCopy('copy-102', 'WB-00102', 'book-book-thief', 'FIC ZUS · A5', 'Borrowed'),
    makeCopy('copy-103', 'WB-00103', 'book-book-thief', 'FIC ZUS · A5', 'Borrowed'),

    // The Hobbit (3 copies: 0 Available, 3 Borrowed — matching Figma 6:2206)
    makeCopy('copy-318', 'WB-00318', 'book-hobbit', 'FIC TOL · A4', 'Borrowed'),
    makeCopy('copy-319', 'WB-00319', 'book-hobbit', 'FIC TOL · A4', 'Borrowed'),
    makeCopy('copy-320', 'WB-00320', 'book-hobbit', 'FIC TOL · A4', 'Borrowed'),

    // The House on Mango Street (2 copies: 1 Available, 1 Borrowed — matching Figma 6:2206)
    makeCopy('copy-511', 'WB-00511', 'book-mango-street', 'FIC CIS · A2', 'Available'),
    makeCopy('copy-512', 'WB-00512', 'book-mango-street', 'FIC CIS · A2', 'Borrowed'),

    // A Wrinkle in Time (4 copies: 3 Available, 1 Borrowed — matching Figma 6:2206)
    makeCopy('copy-701', 'WB-00701', 'book-wrinkle-in-time', 'FIC LEN · A3', 'Available'),
    makeCopy('copy-702', 'WB-00702', 'book-wrinkle-in-time', 'FIC LEN · A3', 'Available'),
    makeCopy('copy-703', 'WB-00703', 'book-wrinkle-in-time', 'FIC LEN · A3', 'Available'),
    makeCopy('copy-704', 'WB-00704', 'book-wrinkle-in-time', 'FIC LEN · A3', 'Borrowed'),

    // The Giver (2 copies: 0 Available, 2 Borrowed — matching Figma 6:2206)
    makeCopy('copy-801', 'WB-00801', 'book-the-giver', 'FIC LOW · A3', 'Borrowed'),
    makeCopy('copy-802', 'WB-00802', 'book-the-giver', 'FIC LOW · A3', 'Borrowed'),

    // A Brief History of Time (2 copies: 1 Borrowed by Maya, 1 Available)
    makeCopy('copy-632', 'WB-00632', 'book-brief-history', 'SCI HAW · B2', 'Borrowed'),
    makeCopy('copy-633', 'WB-00633', 'book-brief-history', 'SCI HAW · B2', 'Available'),

    // Wonder (2 copies: 1 Borrowed by Maya, 1 Available)
    makeCopy('copy-216', 'WB-00216', 'book-wonder', 'FIC PAL · A2', 'Borrowed'),
    makeCopy('copy-217', 'WB-00217', 'book-wonder', 'FIC PAL · A2', 'Available'),

    // Devotions (Poetry)
    makeCopy('copy-901', 'WB-00901', 'book-poetry-anthology', 'POE OLI · C1', 'Available'),
    makeCopy('copy-902', 'WB-00902', 'book-poetry-anthology', 'POE OLI · C1', 'Available'),

    // Dế Mèn Phiêu Lưu Ký (Vietnamese / Reference)
    makeCopy('copy-951', 'WB-00951', 'book-vietnamese-classic', 'VIE TOH · D1', 'Available'),
  ];

  const loans: MockLoanRecord[] = [
    // Maya Chen's Loan 1: Wonder (matching Figma 8:535)
    {
      _id: 'loan-2098',
      borrowCode: 'BR-2098',
      studentId: '671a9b2c8f1b2c0015a4e901',
      studentAccountId: 'S10428',
      studentName: 'Maya Chen',
      bookId: 'book-wonder',
      copyId: 'copy-216',
      copyCode: 'WB-00216',
      borrowedAt: '2026-10-08',
      dueDate: '2026-10-22',
      returnedAt: null,
      returnCondition: null,
      conditionNote: null,
      status: 'Active',
      renewalCount: 0,
    },
    // Maya Chen's Loan 2: A Brief History of Time (matching Figma 8:535)
    {
      _id: 'loan-2106',
      borrowCode: 'BR-2106',
      studentId: '671a9b2c8f1b2c0015a4e901',
      studentAccountId: 'S10428',
      studentName: 'Maya Chen',
      bookId: 'book-brief-history',
      copyId: 'copy-632',
      copyCode: 'WB-00632',
      borrowedAt: '2026-10-12',
      dueDate: '2026-10-26',
      returnedAt: null,
      returnCondition: null,
      conditionNote: null,
      status: 'Active',
      renewalCount: 0,
    },
    // Oliver Brown's Overdue Loan: The Hobbit (matching API_Contract.md Section 7.6)
    {
      _id: 'loan-2081',
      borrowCode: 'BR-2081',
      studentId: '671a9b2c8f1b2c0015a4e902',
      studentAccountId: 'S10312',
      studentName: 'Oliver Brown',
      bookId: 'book-hobbit',
      copyId: 'copy-318',
      copyCode: 'WB-00318',
      borrowedAt: '2026-09-29',
      dueDate: '2026-10-13',
      returnedAt: null,
      returnCondition: null,
      conditionNote: null,
      status: 'Active',
      renewalCount: 0,
    },
    // Amira Khan's Active Loan on The Midnight Library WB-00423 (matching API_Contract.md Section 7.2)
    {
      _id: 'loan-2090',
      borrowCode: 'BR-2090',
      studentId: '671a9b2c8f1b2c0015a4e903',
      studentAccountId: 'S10216',
      studentName: 'Amira Khan',
      bookId: 'book-midnight-library',
      copyId: 'copy-423',
      copyCode: 'WB-00423',
      borrowedAt: '2026-10-02',
      dueDate: '2026-10-16',
      returnedAt: null,
      returnCondition: null,
      conditionNote: null,
      status: 'Active',
      renewalCount: 0,
    },
  ];

  return {
    users,
    books,
    copies,
    loans,
    holds: [],
    nextHoldSeq: 1042, // First hold created will be HLD-1042 matching Figma!
    nextBorrowSeq: 2112,
    featuredBookIds: [
      'book-midnight-library',
      'book-book-thief',
      'book-hobbit',
      'book-mango-street',
    ],
  };
}

export function getMockDb(): MockDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as MockDatabase;
    }
  } catch (err) {
    console.warn('[MSW DB] Failed to read localStorage, falling back to seed.', err);
  }
  const initial = createInitialSeedDatabase();
  saveMockDb(initial);
  return initial;
}

export function saveMockDb(db: MockDatabase): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (err) {
    console.warn('[MSW DB] Failed to save to localStorage.', err);
  }
}

export function resetMockDb(): MockDatabase {
  const initial = createInitialSeedDatabase();
  saveMockDb(initial);
  return initial;
}

export function getDemoToday(): string {
  return DEMO_TODAY;
}
