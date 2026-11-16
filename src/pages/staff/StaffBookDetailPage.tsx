import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  deleteBookApi,
  getBookByIdApi,
  updateBookApi,
} from '../../api/endpoints';
import { ApiClientError } from '../../api/client';
import { BookCoverGraphic } from '../../components/BookCoverGraphic';
import { AddCopyModal } from '../../components/staff/AddCopyModal';
import { EditCopyModal } from '../../components/staff/EditCopyModal';
import {
  BookCategory,
  BookDetail,
  BookDetailCopy,
} from '../../types/api';

const CATEGORIES: BookCategory[] = [
  'Fiction',
  'Non-fiction',
  'Poetry',
  'Graphic novels',
  'Reference',
];

function stateBadgeClass(state: BookDetailCopy['state']): string {
  switch (state) {
    case 'Available':
      return 'bg-[#E8F5EF] text-[#17645F]';
    case 'Borrowed':
      return 'bg-[#FFF4E6] text-[#B55400]';
    case 'Reserved':
      return 'bg-[#EDF2FF] text-[#315FF4]';
    case 'Damaged':
    case 'Lost':
      return 'bg-red-50 text-[#A1372B]';
  }
}

export const StaffBookDetailPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [book, setBook] = useState<BookDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [category, setCategory] = useState<BookCategory>('Fiction');
  const [publisher, setPublisher] = useState('');
  const [keywordsInput, setKeywordsInput] = useState('');

  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [isDeletingTitle, setIsDeletingTitle] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(
    (location.state as { message?: string } | null)?.message || null,
  );
  const [actionError, setActionError] = useState<string | null>(null);

  const [addCopyOpen, setAddCopyOpen] = useState(false);
  const [editingCopy, setEditingCopy] = useState<BookDetailCopy | null>(null);

  const syncFormFromBook = (detail: BookDetail) => {
    setTitle(detail.title);
    setAuthor(detail.author);
    setIsbn(detail.isbn);
    setCategory(detail.category);
    setPublisher(detail.publisher || '');
    setKeywordsInput(detail.keywords.join(', '));
  };

  const loadBook = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const detail = await getBookByIdApi(id);
      setBook(detail);
      syncFormFromBook(detail);
    } catch (err) {
      setLoadError(
        err instanceof ApiClientError
          ? err.message
          : 'Unable to load this book title.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadBook();
  }, [loadBook]);

  const handleSaveTitle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!book) return;
    setActionError(null);
    setFeedbackMessage(null);

    if (!title.trim() || !author.trim() || !isbn.trim()) {
      setActionError('Title, author, and ISBN are required.');
      return;
    }

    setIsSavingTitle(true);
    try {
      const keywords = keywordsInput
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);
      await updateBookApi(book._id, {
        title: title.trim(),
        author: author.trim(),
        isbn: isbn.trim(),
        category,
        publisher: publisher.trim() || null,
        keywords,
      });
      await loadBook();
      setFeedbackMessage('Title metadata saved.');
    } catch (err) {
      setActionError(
        err instanceof ApiClientError
          ? err.message
          : 'Unable to save title changes.',
      );
    } finally {
      setIsSavingTitle(false);
    }
  };

  const handleDeleteTitle = async () => {
    if (!book || !book.canDeleteTitle) return;
    setActionError(null);
    setIsDeletingTitle(true);
    try {
      await deleteBookApi(book._id);
      navigate('/staff/books', {
        replace: true,
        state: { message: `Title "${book.title}" deleted.` },
      });
    } catch (err) {
      setActionError(
        err instanceof ApiClientError
          ? err.message
          : 'Unable to delete this book title.',
      );
      setIsDeletingTitle(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-brand-slate">
        Loading book and physical copies…
      </div>
    );
  }

  if (!book) {
    return (
      <div className="py-24 text-center">
        <p className="font-serif text-[26px] text-brand-ink">Book not found</p>
        <p className="mt-2 text-[14px] text-brand-slate">{loadError}</p>
        <Link
          to="/staff/books"
          className="mt-5 h-10 px-5 rounded-md bg-brand-teal text-white inline-flex items-center text-[13px] font-semibold"
        >
          Back to books
        </Link>
      </div>
    );
  }

  const s = book.stockSummary;

  return (
    <div className="pt-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[13px] text-brand-slate">
        <span>Books &amp; copies / {book.title}</span>
        <span>Thursday, 15 October 2026</span>
      </div>

      <div className="mt-2 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <BookCoverGraphic title={book.title} author={book.author} size="xs" />
          <div>
            <h1 className="font-serif text-[30px] leading-[38px] font-semibold text-brand-ink">
              {book.title}
            </h1>
            <p className="mt-1 text-[14px] text-brand-slate">
              {book.author} · Edit the title once. Maintain IDs, locations and condition separately for each physical copy.
            </p>
          </div>
        </div>

        <Link
          to="/staff/books"
          className="h-10 px-4 rounded-md border border-brand-border bg-white inline-flex items-center gap-2 text-[13px] font-semibold text-brand-teal hover:border-brand-teal shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to books</span>
        </Link>
      </div>

      {feedbackMessage && (
        <div
          role="status"
          className="mt-5 rounded-lg border border-brand-teal/30 bg-brand-mint/50 px-4 py-3 text-[13px] font-medium text-brand-teal"
        >
          {feedbackMessage}
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800"
        >
          {actionError}
        </div>
      )}

      {/* Book Metadata Section */}
      <section className="mt-6 rounded-xl border border-brand-border bg-white p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-serif text-[20px] font-semibold text-brand-ink">
              Book metadata
            </h2>
            <p className="mt-0.5 text-[13px] text-brand-slate">
              Changes apply to the title, not to its loan records.
            </p>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded bg-brand-beige text-[11px] font-semibold text-brand-slate">
            Book record
          </span>
        </div>

        <form onSubmit={(e) => void handleSaveTitle(e)} className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-brand-ink">
                Title <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1.5 w-full h-10 rounded-md border border-brand-border px-3 text-[13px] focus:outline-none focus:border-brand-teal"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-brand-ink">
                Author <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="mt-1.5 w-full h-10 rounded-md border border-brand-border px-3 text-[13px] focus:outline-none focus:border-brand-teal"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-brand-ink">
                ISBN <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                className="mt-1.5 w-full h-10 rounded-md border border-brand-border px-3 text-[13px] font-mono focus:outline-none focus:border-brand-teal"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-brand-ink">
                Category <span className="text-red-600">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as BookCategory)}
                className="mt-1.5 w-full h-10 rounded-md border border-brand-border bg-white px-3 text-[13px] focus:outline-none focus:border-brand-teal"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-brand-ink">
                Publisher
              </label>
              <input
                type="text"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                className="mt-1.5 w-full h-10 rounded-md border border-brand-border px-3 text-[13px] focus:outline-none focus:border-brand-teal"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-brand-ink">
                Keywords
              </label>
              <input
                type="text"
                value={keywordsInput}
                onChange={(e) => setKeywordsInput(e.target.value)}
                placeholder="Contemporary, fantasy, choices"
                className="mt-1.5 w-full h-10 rounded-md border border-brand-border px-3 text-[13px] focus:outline-none focus:border-brand-teal"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isSavingTitle}
              className="h-10 px-5 rounded-md bg-brand-teal hover:bg-brand-tealHover text-[13px] font-semibold text-white disabled:opacity-60"
            >
              {isSavingTitle ? 'Saving…' : 'Save title changes'}
            </button>
            <button
              type="button"
              disabled={isSavingTitle}
              onClick={() => syncFormFromBook(book)}
              className="h-10 px-5 rounded-md border border-brand-border text-[13px] font-semibold text-brand-teal hover:border-brand-teal"
            >
              Discard changes
            </button>
          </div>
        </form>
      </section>

      {/* Physical Copies Section */}
      <section className="mt-6 rounded-xl border border-brand-border bg-white p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-[20px] font-semibold text-brand-ink">
              Physical copies
            </h2>
            <p className="mt-0.5 text-[13px] text-brand-slate">
              {s.availableCopies} Available · {s.borrowedCopies} Borrowed ·{' '}
              {s.reservedCopies} Reserved · {s.damagedCopies} Damaged ·{' '}
              {s.lostCopies} Lost |{' '}
              <span className="font-semibold text-brand-ink">
                {s.totalCopies} {s.totalCopies === 1 ? 'copy' : 'copies'} total
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => setAddCopyOpen(true)}
            className="h-10 px-4 rounded-md bg-brand-teal hover:bg-brand-tealHover text-[13px] font-semibold text-white inline-flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add copy</span>
          </button>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-brand-border text-[11px] font-semibold tracking-wider text-brand-slate uppercase">
                <th className="py-3 pr-4">Copy ID / Barcode</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">State / Condition</th>
                <th className="py-3 px-4">Borrower / Due</th>
                <th className="py-3 pl-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border text-[13px]">
              {book.copies.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-12 text-center text-brand-slate"
                  >
                    This title currently has 0 physical copies. Click &ldquo;+ Add copy&rdquo; to register the first copy barcode.
                  </td>
                </tr>
              ) : (
                book.copies.map((copy) => (
                  <tr key={copy._id} className="hover:bg-brand-canvas/40">
                    <td className="py-3.5 pr-4 font-mono font-semibold text-brand-ink">
                      {copy.copyCode}
                    </td>
                    <td className="py-3.5 px-4 text-brand-ink">
                      {copy.homeLocation}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${stateBadgeClass(
                            copy.state,
                          )}`}
                        >
                          {copy.state}
                        </span>
                        <span className="text-[12px] text-brand-slate">
                          · {copy.condition}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[12px] text-brand-slate">
                      {copy.activeLoan ? (
                        <div>
                          <span className="font-semibold text-brand-ink">
                            {copy.activeLoan.studentName} ·{' '}
                            {copy.activeLoan.studentAccountId}
                          </span>
                          <span className="block">
                            Due {copy.activeLoan.dueDate} ·{' '}
                            {copy.activeLoan.borrowCode}
                          </span>
                        </div>
                      ) : copy.activeHold ? (
                        <div>
                          <span className="font-semibold text-brand-ink">
                            Reserved for {copy.activeHold.studentName} (
                            {copy.activeHold.studentAccountId})
                          </span>
                          <span className="block">
                            Collect by {copy.activeHold.collectBy} ·{' '}
                            {copy.activeHold.holdCode}
                          </span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3.5 pl-4 text-right">
                      <button
                        type="button"
                        onClick={() => setEditingCopy(copy)}
                        className="h-8 px-3.5 rounded-md border border-brand-border bg-white text-[12px] font-semibold text-brand-teal hover:border-brand-teal"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-[12px] text-brand-slate">
          Location is the home shelf. Borrowed copies are with the named student. Stock is derived; it cannot be edited directly.
        </p>
      </section>

      {/* Rules & Delete Title Cards */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-xl border border-brand-border bg-white p-5">
          <h3 className="text-[15px] font-semibold text-brand-ink">
            Copy state rules
          </h3>
          <p className="mt-1 text-[12px] font-semibold text-brand-teal">
            Available · Borrowed · Reserved · Damaged · Lost
          </p>
          <p className="mt-1.5 text-[13px] text-brand-slate leading-relaxed">
            Borrowed and Reserved follow loan and reservation records. Complete the return before changing a borrowed copy&rsquo;s state. Never release another student&rsquo;s reserved copy at checkout.
          </p>
        </section>

        <section className="rounded-xl border border-brand-border bg-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-[15px] font-semibold text-brand-ink">
              Delete title
            </h3>
            <p className="mt-1 text-[13px] text-brand-slate">
              {book.canDeleteTitle
                ? 'This title has 0 physical copies and no loan history. It can be permanently deleted.'
                : book.deleteDisabledReason ||
                  'Unavailable: this title has physical copies and loan history. Borrowed copies and historical loans cannot be deleted.'}
            </p>
          </div>
          <button
            type="button"
            disabled={!book.canDeleteTitle || isDeletingTitle}
            onClick={() => void handleDeleteTitle()}
            className="shrink-0 h-10 px-4 rounded-md bg-[#A1372B] hover:bg-[#842D23] text-[13px] font-semibold text-white disabled:bg-brand-beige disabled:text-brand-slate disabled:cursor-not-allowed"
          >
            {isDeletingTitle ? 'Deleting…' : 'Delete title'}
          </button>
        </section>
      </div>

      {addCopyOpen && (
        <AddCopyModal
          book={book}
          onCancel={() => setAddCopyOpen(false)}
          onAdded={(copyCode) => {
            setAddCopyOpen(false);
            setFeedbackMessage(`Physical copy ${copyCode} added.`);
            void loadBook();
          }}
        />
      )}

      {editingCopy && (
        <EditCopyModal
          book={book}
          copy={editingCopy}
          onCancel={() => setEditingCopy(null)}
          onUpdated={(msg) => {
            setEditingCopy(null);
            setFeedbackMessage(msg);
            void loadBook();
          }}
        />
      )}
    </div>
  );
};
