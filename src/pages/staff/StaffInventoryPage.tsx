import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getBooksApi } from '../../api/endpoints';
import { ApiClientError } from '../../api/client';
import { BookCoverGraphic } from '../../components/BookCoverGraphic';
import { AddBookModal } from '../../components/staff/AddBookModal';
import { useToast } from '../../context/ToastContext';
import { formatBorrowingToday } from '../../utils/borrowingDates';
import {
  BookCategory,
  CatalogBookItem,
  PaginationInfo,
} from '../../types/api';

const CATEGORIES: Array<'All' | BookCategory> = [
  'All',
  'Fiction',
  'Non-fiction',
  'Poetry',
  'Graphic novels',
  'Reference',
];

export const StaffInventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [queryInput, setQueryInput] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [category, setCategory] = useState<'All' | BookCategory>('All');
  const [stockFilter, setStockFilter] = useState<
    'all' | 'available' | 'unavailable'
  >('all');
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');

  const [books, setBooks] = useState<CatalogBookItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    totalItems: 0,
    currentPage: 1,
    totalPages: 1,
    limit: 8,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(
    (location.state as { message?: string } | null)?.message || null,
  );
  const [addBookOpen, setAddBookOpen] = useState(false);

  useEffect(() => {
    const stateMsg = (location.state as { message?: string } | null)?.message;
    if (stateMsg) {
      showToast(stateMsg, 'success');
    }
  }, [location.state, showToast]);

  const loadBooks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getBooksApi({
        q: appliedQuery || undefined,
        category: category === 'All' ? undefined : category,
        stock: stockFilter,
        sortBy: 'title',
        page,
        limit: 8,
      });
      setBooks(result.items);
      setPagination(result.pagination);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'Unable to load the title inventory.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [appliedQuery, category, stockFilter, page]);

  useEffect(() => {
    void loadBooks();
    const handleReset = () => {
      setQueryInput('');
      setAppliedQuery('');
      setCategory('All');
      setStockFilter('all');
      setPage(1);
      void loadBooks();
    };
    window.addEventListener('mock-db-reset', handleReset);
    return () => window.removeEventListener('mock-db-reset', handleReset);
  }, [loadBooks]);

  useEffect(() => {
    setPageInput(String(pagination.currentPage));
  }, [pagination.currentPage]);

  const commitPageInput = () => {
    const parsed = Number.parseInt(pageInput.trim(), 10);
    if (Number.isNaN(parsed)) {
      setPageInput(String(pagination.currentPage));
      return;
    }
    const maxPage = Math.max(1, pagination.totalPages);
    const clamped = Math.min(maxPage, Math.max(1, parsed));
    setPageInput(String(clamped));
    if (clamped !== page) {
      setPage(clamped);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setAppliedQuery(queryInput.trim());
  };

  return (
    <div className="pt-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[13px] text-brand-slate">
        <span>Books &amp; copies / Title inventory</span>
        <span>{formatBorrowingToday()}</span>
      </div>

      <div className="mt-2 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-[32px] leading-[40px] font-semibold text-brand-ink">
            Manage Books
          </h1>
          <p className="mt-1.5 text-[14px] text-brand-slate">
            Manage title information and individual physical copies. Stock is calculated from copy states.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAddBookOpen(true)}
          className="h-10 px-5 rounded-md bg-brand-teal hover:bg-brand-tealHover text-[13px] font-semibold text-white inline-flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add book</span>
        </button>
      </div>

      {bannerMessage && (
        <div
          role="status"
          className="mt-5 rounded-lg border border-brand-teal/30 bg-brand-mint/50 px-4 py-3 text-[13px] font-medium text-brand-teal flex items-center justify-between gap-3"
        >
          <span>{bannerMessage}</span>
          <button
            type="button"
            onClick={() => setBannerMessage(null)}
            className="text-[12px] underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <section className="mt-6 rounded-xl border border-brand-border bg-white p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-serif text-[20px] font-semibold text-brand-ink">
              Title inventory
            </h2>
            <p className="mt-0.5 text-[13px] text-brand-slate">
              Search includes title, author, ISBN, keywords and category.
            </p>
          </div>
          <span className="text-[12px] font-medium text-brand-slate">
            {pagination.totalItems}{' '}
            {pagination.totalItems === 1 ? 'title' : 'titles'} · All matching titles shown
          </span>
        </div>

        <form
          onSubmit={handleSearchSubmit}
          className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_190px_190px_auto] gap-3"
        >
          <div className="relative">
            <Search className="w-4 h-4 text-brand-slate absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Search title, author, ISBN or keyword"
              className="w-full h-10 rounded-md border border-brand-border pl-9 pr-3 text-[13px] focus:outline-none focus:border-brand-teal"
            />
          </div>

          <select
            aria-label="Category filter"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as 'All' | BookCategory);
              setPage(1);
            }}
            className="h-10 rounded-md border border-brand-border bg-white px-3 text-[13px] focus:outline-none focus:border-brand-teal"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                Category: {cat}
              </option>
            ))}
          </select>

          <select
            aria-label="Stock filter"
            value={stockFilter}
            onChange={(e) => {
              setStockFilter(
                e.target.value as 'all' | 'available' | 'unavailable',
              );
              setPage(1);
            }}
            className="h-10 rounded-md border border-brand-border bg-white px-3 text-[13px] focus:outline-none focus:border-brand-teal"
          >
            <option value="all">Stock: All</option>
            <option value="available">Stock: Available now</option>
            <option value="unavailable">Stock: All borrowed / 0 avail.</option>
          </select>

          <button
            type="submit"
            className="h-10 px-5 rounded-md bg-brand-teal hover:bg-brand-tealHover text-[13px] font-semibold text-white"
          >
            Search
          </button>
        </form>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-md bg-red-50 border border-red-200 px-3.5 py-2.5 text-[13px] text-red-800"
          >
            {error}
          </div>
        )}

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-brand-border text-[11px] font-semibold tracking-wider text-brand-slate uppercase">
                <th className="py-3 pr-4">Title / Author / ISBN</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Available / Total</th>
                <th className="py-3 pl-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border text-[13px]">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-14 text-center text-brand-slate"
                  >
                    Loading inventory…
                  </td>
                </tr>
              ) : books.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-14 text-center text-brand-slate"
                  >
                    No matching book titles found.
                  </td>
                </tr>
              ) : (
                books.map((book) => {
                  const {
                    availableCopies,
                    totalCopies,
                    borrowedCopies,
                    reservedCopies,
                  } = book.stockSummary;
                  return (
                    <tr key={book._id} className="hover:bg-brand-canvas/40">
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-3.5">
                          <BookCoverGraphic
                            title={book.title}
                            author={book.author}
                            coverKey={book.isbn}
                            size="xs"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-[14px] text-brand-ink">
                              {book.title}
                            </p>
                            <p className="text-[12px] text-brand-slate">
                              {book.author} · <span className="font-mono">{book.isbn}</span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-brand-beige text-[12px] font-medium text-brand-ink">
                          {book.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`font-semibold text-[14px] ${
                              availableCopies > 0
                                ? 'text-brand-teal'
                                : 'text-[#B55400]'
                            }`}
                          >
                            {availableCopies} / {totalCopies}
                          </span>
                          {totalCopies === 0 ? (
                            <span className="text-[12px] text-brand-slate">
                              No copies added yet
                            </span>
                          ) : (
                            <span className="text-[12px] text-brand-slate">
                              {borrowedCopies > 0
                                ? `${borrowedCopies} borrowed`
                                : ''}
                              {borrowedCopies > 0 && reservedCopies > 0
                                ? ' · '
                                : ''}
                              {reservedCopies > 0
                                ? `${reservedCopies} reserved`
                                : ''}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        <Link
                          to={`/staff/books/${encodeURIComponent(book._id)}`}
                          className="h-9 px-4 rounded-md border border-brand-border bg-white inline-flex items-center justify-center text-[13px] font-semibold text-brand-teal hover:border-brand-teal transition-colors"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 pt-4 border-t border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[12px] text-brand-slate">
          <span>
            Available / total = Available copies ÷ all physical copies. Reserved, Borrowed, Damaged and Lost copies are not available.
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                commitPageInput();
              }}
              className="inline-flex items-center gap-1.5"
            >
              <label htmlFor="inventory-page-input">Page</label>
              <input
                id="inventory-page-input"
                type="text"
                inputMode="numeric"
                aria-label="Go to page"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onBlur={commitPageInput}
                className="w-11 h-8 rounded border border-brand-border bg-white px-1.5 text-center text-[12px] font-semibold text-brand-ink focus:outline-none focus:border-brand-teal"
              />
              <span>of {pagination.totalPages}</span>
            </form>
            <button
              type="button"
              disabled={pagination.currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 px-3 rounded border border-brand-border font-semibold text-brand-teal disabled:opacity-50"
            >
              Previous page
            </button>
            <button
              type="button"
              disabled={pagination.currentPage >= pagination.totalPages}
              onClick={() =>
                setPage((p) => Math.min(pagination.totalPages, p + 1))
              }
              className="h-8 px-3 rounded border border-brand-border font-semibold text-brand-teal disabled:opacity-50"
            >
              Next page
            </button>
          </div>
        </div>
      </section>

      {addBookOpen && (
        <AddBookModal
          onCancel={() => setAddBookOpen(false)}
          onCreated={(created) => {
            setAddBookOpen(false);
            showToast(`Title "${created.title}" created with 0 copies.`, 'success');
            navigate(`/staff/books/${encodeURIComponent(created._id)}`, {
              state: {
                message: `Title "${created.title}" created with 0 copies. Add physical copies below.`,
              },
            });
          }}
        />
      )}
    </div>
  );
};
