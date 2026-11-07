import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  MapPin,
  Bookmark,
  CheckCircle2,
  Info,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { createHoldApi, getBookByIdApi } from '../api/endpoints';
import { BookDetail } from '../types/api';
import { BookCoverGraphic } from '../components/BookCoverGraphic';
import { ApiClientError } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const BookDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [book, setBook] = useState<BookDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmittingHold, setIsSubmittingHold] = useState<boolean>(false);
  const [holdError, setHoldError] = useState<string | null>(null);

  const loadBook = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const detail = await getBookByIdApi(id);
      setBook(detail);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setLoadError(err.message);
      } else {
        setLoadError('Unable to load book details.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadBook();
    const handleReset = () => void loadBook();
    window.addEventListener('mock-db-reset', handleReset);
    return () => window.removeEventListener('mock-db-reset', handleReset);
  }, [loadBook]);

  const handleRequestHold = async () => {
    if (!book) return;
    setHoldError(null);
    setIsSubmittingHold(true);
    try {
      const confirmation = await createHoldApi(book._id);
      await refreshUser();
      navigate(`/holds/${confirmation.holdCode}/confirmed`, {
        state: { confirmation },
      });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setHoldError(err.message);
      } else {
        setHoldError('Could not place a hold right now. Please try again.');
      }
      void loadBook();
    } finally {
      setIsSubmittingHold(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-10 space-y-8 animate-pulse">
        <div className="h-5 w-64 bg-brand-border rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
          <div className="h-[460px] bg-white rounded-2xl border border-brand-border" />
          <div className="h-[380px] bg-white rounded-2xl border border-brand-border" />
        </div>
      </div>
    );
  }

  if (loadError || !book) {
    return (
      <div className="py-12">
        <div className="rounded-2xl border border-brand-border bg-white p-10 text-center space-y-4 max-w-lg mx-auto">
          <p className="font-serif text-[26px] text-brand-ink">Book not found</p>
          <p className="text-[14px] text-brand-slate">
            {loadError || 'We could not find that book in our catalog.'}
          </p>
          <Link
            to="/books"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[8px] bg-brand-teal text-white text-[13px] font-semibold hover:bg-brand-tealHover"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to catalog</span>
          </Link>
        </div>
      </div>
    );
  }

  const { stockSummary, viewerContext } = book;
  const isAvailableNow = stockSummary.availableCopies > 0;
  const canRequestHold =
    isAvailableNow && (viewerContext ? viewerContext.canRequestHold : true);
  const existingHoldCode = viewerContext?.existingHoldCode || null;

  // Format eyebrow e.g. "FICTION / CONTEMPORARY"
  const genreShort = book.genre
    ? book.genre.replace(/ fiction$/i, '').toUpperCase()
    : null;
  const eyebrowText = genreShort
    ? `${book.category.toUpperCase()} / ${genreShort}`
    : book.category.toUpperCase();

  // Format shelf display e.g. "FIC HAI · Shelf A3"
  const formattedShelfHeading = book.shelfReference
    ? book.shelfReference.includes('·')
      ? book.shelfReference.replace('· ', '· Shelf ')
      : book.shelfReference
    : 'Main library';

  return (
    <div className="py-7 md:py-9 space-y-8">
      {/* Breadcrumb Bar matching Figma node 6:2440 */}
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-2 text-[13px]"
      >
        <Link
          to="/books"
          className="inline-flex items-center gap-1.5 font-medium text-brand-teal hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to results</span>
        </Link>
        <span className="text-brand-slate">/</span>
        <Link
          to={`/books?category=${encodeURIComponent(book.category)}`}
          className="text-brand-slate hover:text-brand-ink"
        >
          {book.category}
        </Link>
        <span className="text-brand-slate">/</span>
        <span className="text-brand-slate truncate max-w-[260px]">
          {book.title}
        </span>
      </nav>

      {/* Main Content Layout: Left+Center (Book + Copies Table) & Right Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 items-start">
        {/* Left + Center Area */}
        <div className="space-y-12">
          {/* Top Book Overview */}
          <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-9 items-start">
            {/* Cover Column */}
            <div className="space-y-3">
              <div className="rounded-[14px] bg-brand-beige p-7 min-h-[380px] flex items-center justify-center">
                <BookCoverGraphic
                  title={book.title}
                  author={book.author}
                  size="lg"
                />
              </div>
              <div className="flex items-center justify-center gap-2 text-[12px] text-brand-slate">
                <BookOpen className="w-3.5 h-3.5 text-brand-teal" />
                <span>
                  {book.format} · {book.language}
                  {book.pageCount ? ` · ${book.pageCount} pages` : ''}
                </span>
              </div>
            </div>

            {/* Metadata Column */}
            <div className="space-y-5">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold tracking-[0.06em] uppercase text-brand-teal">
                  {eyebrowText}
                </p>
                <h1 className="font-serif text-[36px] md:text-[42px] leading-[1.15] text-brand-ink font-normal">
                  {book.title}
                </h1>
                <p className="text-[16px] text-brand-slate">by {book.author}</p>
              </div>

              {/* Keyword Pills */}
              {book.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {book.keywords
                    .filter((kw) => kw.toLowerCase() !== 'fiction')
                    .map((kw) => (
                      <span
                        key={kw}
                        className="px-3 py-1 rounded-[6px] bg-brand-beige text-brand-slate text-[12px] font-medium"
                      >
                        {kw}
                      </span>
                    ))}
                </div>
              )}

              {/* About this book */}
              <div className="space-y-2.5 pt-1">
                <h2 className="text-[14px] font-semibold text-brand-ink">
                  About this book
                </h2>
                <div className="text-[14px] leading-[1.65] text-brand-slate space-y-3 whitespace-pre-line">
                  {book.description ||
                    'Explore this title in the Westbridge School Library collection.'}
                </div>
              </div>

              {/* 2x2 Metadata Specs */}
              <div className="border-t border-brand-border pt-5 grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-[11px] text-brand-slate">ISBN</p>
                  <p className="text-[13px] font-semibold text-brand-ink mt-0.5">
                    {book.isbn}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-brand-slate">Publisher</p>
                  <p className="text-[13px] font-semibold text-brand-ink mt-0.5">
                    {book.publisher || 'Westbridge Press'}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-brand-slate">Published</p>
                  <p className="text-[13px] font-semibold text-brand-ink mt-0.5">
                    {book.publishedYear || '—'}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-brand-slate">Shelf reference</p>
                  <p className="text-[13px] font-semibold text-brand-ink mt-0.5">
                    {book.shelfReference || 'Main library'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Copies in our library Table */}
          <section className="space-y-4">
            <h2 className="font-serif text-[25px] text-brand-ink font-normal">
              Copies in our library
            </h2>

            <div className="rounded-[12px] border border-brand-border bg-white overflow-hidden">
              <div className="bg-brand-beige px-6 py-3.5 grid grid-cols-[1.1fr_1fr_1.5fr] text-[11px] font-semibold tracking-[0.05em] uppercase text-brand-slate">
                <span>COPY ID</span>
                <span>STATUS</span>
                <span>LOCATION</span>
              </div>

              <div className="divide-y divide-brand-border">
                {book.copies.map((copy) => {
                  const isCopyAvailable = copy.state === 'Available';
                  const isCopyReserved = copy.state === 'Reserved';

                  return (
                    <div
                      key={copy._id}
                      className="px-6 py-4 grid grid-cols-[1.1fr_1fr_1.5fr] items-center text-[13px]"
                    >
                      <span className="font-medium text-brand-ink">
                        {copy.copyCode}
                      </span>

                      <div>
                        {isCopyAvailable ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-brand-mint text-brand-teal text-[12px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-teal" />
                            <span>Available</span>
                          </span>
                        ) : isCopyReserved ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-brand-mint text-brand-teal text-[12px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-teal" />
                            <span>Reserved</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-brand-amberSurface text-brand-amberText text-[12px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-amberText" />
                            <span>
                              {copy.state === 'Borrowed'
                                ? 'On loan'
                                : copy.state}
                            </span>
                          </span>
                        )}
                      </div>

                      <span className="text-brand-slate">
                        {copy.displayLocation}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>

        {/* Right Sidebar Column */}
        <aside className="space-y-4">
          {/* Availability & Hold Action Card */}
          <div className="rounded-[14px] border border-brand-border bg-white p-6 space-y-5">
            <div>
              {isAvailableNow ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-brand-mint text-brand-teal text-[12px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-teal" />
                  <span>Available to borrow</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-brand-amberSurface text-brand-amberText text-[12px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-amberText" />
                  <span>All copies on loan</span>
                </span>
              )}
            </div>

            <div className="space-y-1">
              <p className="font-serif text-[26px] leading-tight text-brand-ink">
                {stockSummary.availableCopies} of {stockSummary.totalCopies}{' '}
                copies available
              </p>
              <p className="text-[12.5px] text-brand-slate">
                {stockSummary.borrowedCopies} on loan
                {stockSummary.reservedCopies > 0
                  ? ` · ${stockSummary.reservedCopies} reserved`
                  : ''}
              </p>
            </div>

            {/* Shelf Location */}
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-brand-teal shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-[13px] font-semibold text-brand-ink">
                  {formattedShelfHeading}
                </p>
                <p className="text-[12px] text-brand-slate">
                  {book.sectionName || `${book.category} section · Main library`}
                </p>
              </div>
            </div>

            {holdError && (
              <div
                role="alert"
                className="rounded-[8px] bg-red-50 border border-red-200 p-3 flex items-start gap-2 text-[12px] text-red-800"
              >
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{holdError}</span>
              </div>
            )}

            {/* Hold CTA Button or Existing Hold State */}
            {existingHoldCode ? (
              <div className="space-y-2.5">
                <div className="rounded-[8px] bg-brand-mint px-3.5 py-2.5 text-[12.5px] font-medium text-brand-teal">
                  Hold {existingHoldCode} is active for you on this book.
                </div>
                <Link
                  to={`/holds/${existingHoldCode}/confirmed`}
                  className="inline-flex items-center justify-center gap-2 h-[44px] px-5 rounded-[8px] bg-brand-teal hover:bg-brand-tealHover text-white font-semibold text-[13.5px] transition-colors w-full"
                >
                  <span>View hold confirmation</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled={!canRequestHold || isSubmittingHold}
                  onClick={() => void handleRequestHold()}
                  className={`inline-flex items-center justify-center gap-2 h-[44px] px-5 rounded-[8px] font-semibold text-[14px] transition-colors ${
                    canRequestHold
                      ? 'bg-brand-teal hover:bg-brand-tealHover text-white'
                      : 'bg-brand-beige text-brand-slate cursor-not-allowed'
                  }`}
                >
                  <span>
                    {isSubmittingHold ? 'Requesting hold...' : 'Request to hold'}
                  </span>
                  <Bookmark className="w-4 h-4" />
                </button>

                {!canRequestHold && viewerContext?.blockReason && (
                  <p className="text-[12px] text-brand-amberText font-medium">
                    {viewerContext.blockReason}
                  </p>
                )}
              </div>
            )}

            <p className="text-[12px] leading-[1.55] text-brand-slate">
              We&apos;ll set aside one copy for you. Check your confirmation for
              the pickup deadline.
            </p>

            {/* Student Loan Quota Footer */}
            <div className="border-t border-brand-border pt-4 flex items-center gap-2 text-[12px]">
              {viewerContext?.canBorrow !== false ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-brand-teal shrink-0" />
                  <span className="font-medium text-brand-teal">
                    You can borrow · {viewerContext?.activeLoansCount ?? 2} of{' '}
                    {viewerContext?.maxLoansLimit ?? 5} loans used
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-brand-amberText shrink-0" />
                  <span className="font-medium text-brand-amberText">
                    Borrowing restricted · {viewerContext?.activeLoansCount ?? 0}{' '}
                    of {viewerContext?.maxLoansLimit ?? 5} loans used
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Info Callout Box */}
          <div className="rounded-[12px] bg-brand-mint px-4 py-3.5 flex items-start gap-2.5 text-[12px] leading-[1.55] text-brand-ink">
            <Info className="w-4 h-4 text-brand-teal shrink-0 mt-0.5" />
            <span>
              A hold isn&apos;t a loan. Bring your student ID to the library
              counter; staff will confirm borrowing.
            </span>
          </div>

          {/* Before you borrow Card */}
          <div className="rounded-[14px] bg-brand-beige p-6 space-y-3">
            <h3 className="font-serif text-[21px] text-brand-ink font-normal">
              Before you borrow
            </h3>
            <div className="space-y-3 text-[12.5px] leading-[1.6] text-brand-slate">
              <p>
                Borrow up to 5 books for 14 days. Renew online once for 7 extra
                days if no one is waiting.
              </p>
              <p>
                Unreturned overdue books or unpaid fines must be resolved before
                borrowing.
              </p>
              <p>
                Holds can be placed on any book with at least one available
                copy on the shelf.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
