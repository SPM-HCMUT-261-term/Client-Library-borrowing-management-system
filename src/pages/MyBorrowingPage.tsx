import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  RotateCw,
  CheckCircle2,
  Info,
  History,
  ReceiptText,
  AlertCircle,
  ArrowRight,
  Check,
} from 'lucide-react';
import {
  cancelHoldApi,
  getMyBorrowingApi,
  renewLoanApi,
} from '../api/endpoints';
import { MyBorrowingDashboard } from '../types/api';
import { BookCoverGraphic } from '../components/BookCoverGraphic';
import { ApiClientError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatCollectionDeadline, formatBorrowingToday } from '../utils/borrowingDates';

const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function formatShortDate(isoDate: string | null): string {
  if (!isoDate) return '—';
  const clean = isoDate.slice(0, 10);
  const parts = clean.split('-');
  if (parts.length !== 3) return isoDate;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const monthName = MONTHS_SHORT[monthIdx] || parts[1];
  return `${day} ${monthName} ${year}`;
}

function BorrowingCover({ book, size }: { book: { title: string; author: string; coverImageUrl: string | null }; size: 'xs' | 'sm' }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const dimensions = size === 'xs' ? 'w-[46px] h-[68px]' : 'w-[72px] h-[105px]';
  return book.coverImageUrl && failedUrl !== book.coverImageUrl
    ? <img src={book.coverImageUrl} alt={`Cover of ${book.title}`} onError={() => setFailedUrl(book.coverImageUrl)} className={`${dimensions} rounded-sm object-cover shadow-sm`} />
    : <BookCoverGraphic title={book.title} author={book.author} size={size} className={size === 'sm' ? '!w-[72px] !h-[105px]' : '!h-[68px]'} />;
}

export const MyBorrowingPage: React.FC = () => {
  const { refreshUser } = useAuth();
  const [loadError, setLoadError] = useState<string | null>(null);
  const requestVersion = useRef(0);
  const mutationPending = useRef(false);
  const [dashboard, setDashboard] = useState<MyBorrowingDashboard | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [cancellingHoldId, setCancellingHoldId] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const loadDashboard = useCallback(async () => {
    const version = ++requestVersion.current;
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getMyBorrowingApi();
      if (version === requestVersion.current) setDashboard(data);
    } catch (err) {
      if (version === requestVersion.current) setLoadError(err instanceof ApiClientError ? err.message : 'Unable to load your borrowing records. Please try again.');
    } finally {
      if (version === requestVersion.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
    const handleReset = () => {
      setBannerMessage(null);
      void loadDashboard();
    };
    window.addEventListener('mock-db-reset', handleReset);
    return () => { requestVersion.current += 1; window.removeEventListener('mock-db-reset', handleReset); };
  }, [loadDashboard]);

  const handleRenewLoan = async (loanIdOrCode: string) => {
    if (mutationPending.current || isLoading || loadError) return;
    mutationPending.current = true;
    setRenewingId(loanIdOrCode);
    setBannerMessage(null);
    try {
      const res = await renewLoanApi(loanIdOrCode);
      await loadDashboard();
      await refreshUser();
      setBannerMessage({
        type: 'success',
        text:
          res.message ||
          `Loan ${res.data.borrowCode} renewed for 7 extra days (new due date: ${formatShortDate(res.data.newDueDate)}).`,
      });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setBannerMessage({ type: 'error', text: err.message });
      } else {
        setBannerMessage({
          type: 'error',
          text: 'Could not renew this loan right now.',
        });
      }
    } finally {
      mutationPending.current = false;
      setRenewingId(null);
    }
  };

  const handleCancelHold = async (holdCode: string) => {
    if (mutationPending.current || isLoading || loadError) return;
    mutationPending.current = true;
    setCancellingHoldId(holdCode);
    setBannerMessage(null);
    try {
      const res = await cancelHoldApi(holdCode);
      await loadDashboard();
      await refreshUser();
      setBannerMessage({
        type: 'success',
        text:
          res.message ||
          `Hold ${holdCode} has been cancelled and the copy is now available.`,
      });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setBannerMessage({ type: 'error', text: err.message });
      } else {
        setBannerMessage({
          type: 'error',
          text: 'Could not cancel this hold right now.',
        });
      }
    } finally {
      mutationPending.current = false;
      setCancellingHoldId(null);
    }
  };

  if (!dashboard && isLoading) {
    return (
      <div role="status" aria-label="Loading your borrowing records" className="py-10 space-y-8 animate-pulse">
        <div className="h-12 w-72 bg-brand-border rounded" />
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_348px] gap-8">
          <div className="h-96 bg-white rounded-2xl border border-brand-border" />
          <div className="h-80 bg-white rounded-2xl border border-brand-border" />
        </div>
      </div>
    );
  }

  if (!dashboard) return (
    <div className="py-9 space-y-6">
      <h1 className="font-serif text-[40px] text-brand-ink">My borrowing</h1>
      <div role="alert" className="rounded-xl border border-brand-border bg-white p-6">
        <h2 className="font-semibold text-brand-ink">We couldn’t load your borrowing records</h2>
        <p className="mt-2 text-sm text-brand-slate">{loadError}</p>
        <button type="button" onClick={() => void loadDashboard()} className="mt-4 rounded-lg bg-brand-teal px-5 py-2.5 text-sm font-semibold text-white">Try again</button>
      </div>
    </div>
  );

  const {
    accountSummary,
    currentLoans: unsortedLoans,
    holdRequests,
    borrowingHistory,
  } = dashboard;
  const currentLoans = [...unsortedLoans].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const actionDisabled = isLoading || !!loadError || !!renewingId || !!cancellingHoldId;

  const quotaProgressPercent = Math.min(
    100,
    Math.round(
      (accountSummary.activeLoansCount /
        Math.max(1, accountSummary.maxLoansLimit)) *
        100,
    ),
  );

  return (
    <div className="pt-8 md:pt-9 pb-10 space-y-8">
      {/* Page Header matching Figma node 8:535 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-2">
          <h1 className="font-serif text-[36px] md:text-[40px] leading-tight text-brand-ink font-normal">
            My borrowing
          </h1>
          <p className="text-[15px] text-brand-slate">
            Keep track of your reads, your due dates and what&apos;s waiting for
            you.
          </p>
        </div>

        <span className="text-[12px] text-brand-slate pb-1">
          {formatBorrowingToday()}
        </span>
      </div>

      {bannerMessage && (
        <div
          role="status"
          className={`rounded-[10px] px-4 py-3 flex items-center justify-between gap-3 text-[13px] border ${
            bannerMessage.type === 'success'
              ? 'bg-brand-mint border-brand-teal/25 text-brand-teal'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {bannerMessage.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span className="font-medium">{bannerMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerMessage(null)}
            className="text-xs underline opacity-80 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {loadError && <div role="alert" className="rounded-xl border border-brand-amberBorder bg-brand-amberSurface p-4 text-sm text-brand-amberText">
        <p>{loadError} The records below may be out of date.</p>
        <button type="button" disabled={isLoading} onClick={() => void loadDashboard()} className="mt-2 font-semibold underline disabled:opacity-50">Try again</button>
      </div>}
      {isLoading && <p role="status" className="text-sm text-brand-slate">Refreshing your borrowing records…</p>}

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_348px] gap-8 items-start">
        {/* Left Column: Current Loans, Hold Requests, Borrowing History */}
        <div className="min-w-0 space-y-8">
          {/* 1. Current Loans Section */}
          <section className="space-y-4">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-serif text-[25px] leading-8 text-brand-ink font-medium">
                Current loans
              </h2>
              <span className="text-[12px] text-brand-slate">
                {currentLoans.length}{' '}
                {currentLoans.length === 1 ? 'book' : 'books'} · Sorted by due
                date
              </span>
            </div>

            <div className="rounded-[12px] border border-brand-border bg-white overflow-hidden">
              {currentLoans.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <p className="text-[14px] font-semibold text-brand-ink">
                    You have no active book loans
                  </p>
                  <p className="text-[13px] text-brand-slate">
                    Explore the catalog to place a hold or visit the library
                    counter to borrow a book.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-brand-border">
                  {currentLoans.map((loan) => {
                    const isRenewingThis = renewingId === loan._id || renewingId === loan.borrowCode;

                    return (
                      <div key={loan._id} className="p-6 space-y-[18px]">
                        <div className="flex flex-col min-[1350px]:flex-row min-[1350px]:items-center justify-between gap-6">
                          {/* Book Cover & Title */}
                          <div className="flex items-center gap-4">
                            <Link
                              to={`/books/${loan.book._id}`}
                              className="shrink-0"
                            >
                              <BorrowingCover book={loan.book} size="xs" />
                            </Link>

                            <div className="min-w-0 space-y-2">
                              <Link
                                to={`/books/${loan.book._id}`}
                                className="text-[17px] font-semibold text-brand-ink hover:text-brand-teal transition-colors block"
                              >
                                {loan.book.title}
                              </Link>
                              <p className="text-[13px] text-brand-slate">
                                {loan.book.author}
                              </p>
                              <p className="text-[12px] text-brand-slate pt-0.5">
                                Borrowed {formatShortDate(loan.borrowedAt)}
                              </p>
                            </div>
                          </div>

                          {/* Due Date & Renew Action */}
                          <div className="flex flex-wrap items-center justify-between min-[1350px]:justify-end gap-6">
                            <div className="space-y-1.5">
                              <p className="text-[13.5px] font-semibold text-brand-ink">
                                Due {formatShortDate(loan.dueDate)}
                              </p>
                              <div>
                                {loan.isOverdue ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] bg-brand-amberSurface text-brand-amberText text-[11.5px] font-semibold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-amberText" />
                                    <span>
                                      Overdue · {Math.abs(loan.daysLeft)} days
                                    </span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] bg-brand-mint text-brand-teal text-[11.5px] font-semibold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-teal" />
                                    <span>{loan.daysLeft} days left</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col items-start min-[1350px]:items-center gap-2 min-w-[164px]">
                              {loan.canRenew ? (
                                <>
                                  <button
                                    type="button"
                                    disabled={actionDisabled}
                                    onClick={() =>
                                      void handleRenewLoan(loan.borrowCode)
                                    }
                                    className="h-[42px] px-5 rounded-[8px] bg-brand-teal hover:bg-brand-tealHover disabled:opacity-60 text-white font-semibold text-[13px] inline-flex items-center gap-2 transition-colors"
                                  >
                                    <RotateCw
                                      className={`w-3.5 h-3.5 ${
                                        isRenewingThis ? 'animate-spin' : ''
                                      }`}
                                    />
                                    <span>
                                      {isRenewingThis
                                        ? 'Renewing...'
                                        : 'Renew for 7 days'}
                                    </span>
                                  </button>
                                  {loan.newDueDatePreview && (
                                    <span className="text-[11px] text-brand-slate">
                                      New due date:{' '}
                                      {formatShortDate(loan.newDueDatePreview)}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <button
                                  type="button"
                                  disabled
                                  className="h-[42px] px-5 rounded-[8px] bg-brand-beige text-brand-slate font-semibold text-[13px] inline-flex items-center gap-2 cursor-not-allowed"
                                >
                                  <RotateCw className="w-3.5 h-3.5" />
                                  <span>
                                    {loan.renewalCount >= 1
                                      ? 'Renewed once'
                                      : 'Renewal unavailable'}
                                  </span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Renewal Status Footnote */}
                        <div className="flex items-center gap-2 text-[12px]">
                          {loan.canRenew ? <CheckCircle2 className="w-3.5 h-3.5 text-brand-teal shrink-0" /> : <Info className="w-3.5 h-3.5 text-brand-amberText shrink-0" />}
                          <span className={loan.canRenew ? 'text-brand-teal' : 'text-brand-amberText'}>
                            {loan.renewalStatusText}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="border-t border-brand-border px-6 py-3.5 flex items-center gap-2.5 text-[12px] text-brand-slate bg-white">
                <Info className="w-4 h-4 text-brand-teal shrink-0" />
                <span>
                  Finished reading? Bring your books to the library counter.
                  Staff record all returns.
                </span>
              </div>
            </div>
          </section>

          {/* 2. Hold Requests Section */}
          <section className="space-y-4">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-serif text-[25px] leading-8 text-brand-ink font-medium">
                Hold requests
              </h2>
              <span className="text-[12px] text-brand-slate">
                {holdRequests.length} ready
              </span>
            </div>

            {holdRequests.length === 0 ? (
              <div className="rounded-[12px] border border-brand-border bg-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-[14px] font-semibold text-brand-ink">
                    No active hold requests right now
                  </p>
                  <p className="text-[13px] text-brand-slate">
                    Reserve an available copy from the catalog and we&apos;ll set
                    it aside at the library counter for you.
                  </p>
                </div>

                <Link
                  to="/books"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-brand-mint text-brand-teal text-[13px] font-semibold hover:bg-brand-teal hover:text-white transition-colors shrink-0"
                >
                  <span>Browse catalog</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {holdRequests.map((hold) => {
                  const isCancelling = cancellingHoldId === hold.holdCode;

                  return (
                    <div
                      key={hold._id}
                      className="rounded-[12px] border border-brand-border bg-white overflow-hidden"
                    >
                      {/* Hold Card Header */}
                      <div className="bg-brand-mint px-6 py-3 flex flex-wrap items-center justify-between gap-2 text-[12px]">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-brand-teal">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-teal" />
                          <span>Ready for collection</span>
                        </span>
                        <span className="text-brand-teal font-medium">
                          Hold {hold.holdCode} · Requested{' '}
                          {formatShortDate(hold.requestedAt)}
                        </span>
                      </div>

                      {/* Hold Card Body */}
                      <div className="p-6 grid grid-cols-1 min-[1350px]:grid-cols-[minmax(0,1fr)_240px] gap-6 items-center">
                        <div className="flex items-center gap-5">
                          <Link
                            to={`/books/${hold.book._id}`}
                            className="shrink-0"
                          >
                            <BorrowingCover book={hold.book} size="sm" />
                          </Link>

                          <div className="space-y-1.5">
                            <Link
                              to={`/books/${hold.book._id}`}
                              className="font-serif text-[22px] leading-snug text-brand-ink hover:text-brand-teal transition-colors block"
                            >
                              {hold.book.title}
                            </Link>
                            <p className="text-[13px] text-brand-slate">
                              {hold.book.author}
                            </p>
                            <p className="text-[12.5px] font-semibold text-brand-ink pt-0.5">
                              Copy {hold.copy.copyCode} · {hold.book.format}
                            </p>
                            <p className="text-[12px] text-brand-slate">
                              {hold.pickupLocation} · Bring your student ID
                            </p>
                            <div className="pt-1">
                              <button
                                type="button"
                                disabled={actionDisabled}
                                onClick={() =>
                                  void handleCancelHold(hold.holdCode)
                                }
                                className="text-[12.5px] font-semibold text-brand-teal hover:underline disabled:opacity-50"
                              >
                                {isCancelling
                                  ? 'Cancelling...'
                                  : 'Cancel this hold'}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* COLLECT BY Box */}
                        <div className="rounded-[10px] bg-brand-amberSurface p-4 space-y-1.5">
                          <p className="text-[10.5px] font-semibold tracking-[0.05em] uppercase text-brand-amberText">
                            COLLECT BY
                          </p>
                          <p className="font-serif text-[21px] leading-tight text-brand-ink">
                            {formatCollectionDeadline(hold.collectBy).date}
                          </p>
                          <p className="text-[13px] font-semibold text-brand-ink">
                            {formatCollectionDeadline(hold.collectBy).time}
                          </p>
                          <p className="text-[11px] leading-[1.45] text-brand-amberText pt-0.5">
                            Uncollected holds are released. Please collect your copy before this deadline.
                          </p>
                        </div>
                      </div>

                      {/* Hold Card Footer */}
                      <div className="border-t border-brand-border px-6 py-3 flex items-center gap-2.5 text-[12px] text-brand-slate">
                        <Info className="w-4 h-4 text-brand-teal shrink-0" />
                        <span>
                          This hold is not a loan. Your 14-day loan starts when
                          staff confirm collection.
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 3. Borrowing History Section */}
          <section className="space-y-4">
            <h2 className="font-serif text-[25px] leading-8 text-brand-ink font-medium">
              Borrowing history
            </h2>

            {borrowingHistory.length === 0 ? (
              <div className="rounded-[12px] border border-brand-border bg-white p-6 flex items-center gap-4">
                <div className="w-10 h-10 rounded-[8px] bg-brand-beige text-brand-teal flex items-center justify-center shrink-0">
                  <History className="w-[18px] h-[18px]" />
                </div>
                <div className="min-w-0 space-y-2">
                  <p className="text-[14px] font-semibold text-brand-ink">
                    No returned books recorded yet
                  </p>
                  <p className="text-[13px] text-brand-slate">
                    Your past reads will appear here once staff record your
                    returns at the counter.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-[12px] border border-brand-border bg-white divide-y divide-brand-border overflow-hidden">
                {borrowingHistory.map((item) => (
                  <div
                    key={item._id}
                    className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <BorrowingCover book={item.book} size="xs" />
                      <div>
                        <p className="text-[15px] font-semibold text-brand-ink">
                          {item.book.title}
                        </p>
                        <p className="text-[12.5px] text-brand-slate">
                          {item.book.author} · Copy {item.copyCode}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-[12px] text-brand-slate">
                      <p className="font-medium text-brand-ink">
                        Returned {formatShortDate(item.returnedAt)}
                      </p>
                      <p>Condition: {item.returnCondition}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Your Account Summary */}
        <aside className="space-y-6">
          <h2 className="font-serif text-[25px] leading-8 text-brand-ink font-medium">
            Your account
          </h2>

          {/* Eligibility & Quota Card */}
          <div className="rounded-[12px] border border-brand-border bg-white p-6 space-y-[18px]">
            <div className="flex items-center gap-2 text-[13px] font-semibold">
              {accountSummary.canBorrow ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-brand-teal shrink-0" />
                  <span className="text-brand-teal">
                    {accountSummary.statusText}
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-brand-amberText shrink-0" />
                  <span className="text-brand-amberText">
                    {accountSummary.statusText}
                  </span>
                </>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-[15px] font-semibold text-brand-ink">
                {accountSummary.activeLoansCount} of{' '}
                {accountSummary.maxLoansLimit} books borrowed
              </p>

              {/* Progress Bar */}
              <div role="progressbar" aria-label="Books borrowed" aria-valuenow={accountSummary.activeLoansCount} aria-valuemin={0} aria-valuemax={accountSummary.maxLoansLimit} className="h-[5px] w-full rounded-full bg-brand-mint overflow-hidden">
                <div
                  className="h-full bg-brand-teal rounded-full transition-all"
                  style={{ width: `${quotaProgressPercent}%` }}
                />
              </div>

              <p className="text-[12px] leading-[1.55] text-brand-slate pt-0.5">
                Room for {accountSummary.remainingLoanSpace} more{' '}
                {accountSummary.remainingLoanSpace === 1 ? 'book' : 'books'}.
                Holds don&apos;t count as loans until collection.
              </p>
            </div>

            <div className="border-t border-brand-border pt-3.5 flex items-center justify-between text-[12.5px]">
              <span className="text-brand-slate">Overdue books</span>
              <span
                className={`font-semibold ${
                  accountSummary.overdueBooksCount === 0
                    ? 'text-brand-teal'
                    : 'text-brand-amberText'
                }`}
              >
                {accountSummary.overdueBooksCount === 0
                  ? 'None'
                  : accountSummary.overdueBooksCount}
              </span>
            </div>
          </div>

          {/* Fines & Charges Card */}
          <div className="rounded-[12px] border border-brand-border bg-white p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-semibold text-brand-ink">
                Fines &amp; charges
              </span>
              <ReceiptText className="w-4 h-4 text-brand-teal" />
            </div>

            <p className="font-serif text-[32px] leading-none text-brand-ink pt-1">
              {accountSummary.unpaidFines.toFixed(2)}
            </p>

            <p className="text-[12.5px] font-semibold text-brand-teal">
              {accountSummary.unpaidFines === 0
                ? 'No unpaid fines'
                : 'Unpaid balance due'}
            </p>

            <p className="text-[12px] leading-[1.55] text-brand-slate pt-0.5">
              Questions about a charge? Ask at the library counter.
            </p>
          </div>

          {/* Quick Notice Card */}
          <div className="rounded-[12px] bg-brand-beige p-6 space-y-4">
            <h3 className="font-serif text-[23px] text-brand-ink font-normal">
              Quick notice
            </h3>
            <div className="space-y-4 text-[13px] leading-[1.6] text-brand-slate">
              <p>Borrow up to {accountSummary.maxLoansLimit} books for 14 days.</p>
              <p>
                Renew each loan online once for 7 extra days, only if nobody
                else has reserved the book.
              </p>
              <p>
                Unreturned overdue books or unpaid fines must be resolved before
                borrowing.
              </p>
              <p>
                Staff confirm check-outs and returns at the library counter.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
