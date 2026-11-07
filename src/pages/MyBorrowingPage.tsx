import React, { useEffect, useState, useCallback } from 'react';
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

export const MyBorrowingPage: React.FC = () => {
  const { refreshUser } = useAuth();
  const [dashboard, setDashboard] = useState<MyBorrowingDashboard | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [cancellingHoldId, setCancellingHoldId] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getMyBorrowingApi();
      setDashboard(data);
    } catch (err) {
      console.error('Failed to load borrowing dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
    const handleReset = () => {
      setBannerMessage(null);
      void loadDashboard();
    };
    window.addEventListener('mock-db-reset', handleReset);
    return () => window.removeEventListener('mock-db-reset', handleReset);
  }, [loadDashboard]);

  const handleRenewLoan = async (loanIdOrCode: string) => {
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
      setRenewingId(null);
    }
  };

  const handleCancelHold = async (holdCode: string) => {
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
      setCancellingHoldId(null);
    }
  };

  if (isLoading || !dashboard) {
    return (
      <div className="py-10 space-y-8 animate-pulse">
        <div className="h-12 w-72 bg-brand-border rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
          <div className="h-96 bg-white rounded-2xl border border-brand-border" />
          <div className="h-80 bg-white rounded-2xl border border-brand-border" />
        </div>
      </div>
    );
  }

  const {
    accountSummary,
    currentLoans,
    holdRequests,
    borrowingHistory,
  } = dashboard;

  const quotaProgressPercent = Math.min(
    100,
    Math.round(
      (accountSummary.activeLoansCount /
        Math.max(1, accountSummary.maxLoansLimit)) *
        100,
    ),
  );

  return (
    <div className="py-8 md:py-10 space-y-8">
      {/* Page Header matching Figma node 8:535 */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div className="space-y-2">
          <h1 className="font-serif text-[36px] md:text-[42px] leading-tight text-brand-ink font-normal">
            My borrowing
          </h1>
          <p className="text-[15px] text-brand-slate">
            Keep track of your reads, your due dates and what&apos;s waiting for
            you.
          </p>
        </div>

        <span className="text-[12px] text-brand-slate pb-1">
          Thursday, 15 October 2026
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

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 items-start">
        {/* Left Column: Current Loans, Hold Requests, Borrowing History */}
        <div className="space-y-10">
          {/* 1. Current Loans Section */}
          <section className="space-y-4">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-serif text-[24px] text-brand-ink font-normal">
                Current loans
              </h2>
              <span className="text-[12px] text-brand-slate">
                {currentLoans.length}{' '}
                {currentLoans.length === 1 ? 'book' : 'books'} · Sorted by due
                date
              </span>
            </div>

            <div className="rounded-[14px] border border-brand-border bg-white overflow-hidden">
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
                      <div key={loan._id} className="p-6 space-y-3.5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                          {/* Book Cover & Title */}
                          <div className="flex items-center gap-4">
                            <Link
                              to={`/books/${loan.book._id}`}
                              className="shrink-0"
                            >
                              <BookCoverGraphic
                                title={loan.book.title}
                                author={loan.book.author}
                                size="xs"
                              />
                            </Link>

                            <div className="space-y-0.5">
                              <Link
                                to={`/books/${loan.book._id}`}
                                className="text-[16px] font-semibold text-brand-ink hover:text-brand-teal transition-colors block"
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
                          <div className="flex flex-wrap items-center justify-between md:justify-end gap-6">
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

                            <div className="flex flex-col items-start md:items-end gap-1.5 min-w-[165px]">
                              {loan.canRenew ? (
                                <>
                                  <button
                                    type="button"
                                    disabled={isRenewingThis}
                                    onClick={() =>
                                      void handleRenewLoan(loan.borrowCode)
                                    }
                                    className="h-[40px] px-4 rounded-[8px] bg-brand-teal hover:bg-brand-tealHover disabled:opacity-60 text-white font-semibold text-[13px] inline-flex items-center gap-2 transition-colors"
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
                                  className="h-[40px] px-4 rounded-[8px] bg-brand-beige text-brand-slate font-semibold text-[13px] inline-flex items-center gap-2 cursor-not-allowed"
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
                          <CheckCircle2 className="w-3.5 h-3.5 text-brand-teal shrink-0" />
                          <span className="text-brand-teal font-medium">
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
              <h2 className="font-serif text-[24px] text-brand-ink font-normal">
                Hold requests
              </h2>
              <span className="text-[12px] text-brand-slate">
                {holdRequests.length} ready
              </span>
            </div>

            {holdRequests.length === 0 ? (
              <div className="rounded-[14px] border border-brand-border bg-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                      className="rounded-[14px] border border-brand-border bg-white overflow-hidden"
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
                      <div className="p-6 grid grid-cols-1 md:grid-cols-[1fr_240px] gap-6 items-center">
                        <div className="flex items-center gap-5">
                          <Link
                            to={`/books/${hold.book._id}`}
                            className="shrink-0"
                          >
                            <BookCoverGraphic
                              title={hold.book.title}
                              author={hold.book.author}
                              size="sm"
                            />
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
                                disabled={isCancelling}
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
                            Fri, 16 October
                          </p>
                          <p className="text-[13px] font-semibold text-brand-ink">
                            3:30 pm
                          </p>
                          <p className="text-[11px] leading-[1.45] text-brand-amberText pt-0.5">
                            Illustrative deadline for this demo. Uncollected
                            holds are released.
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
            <h2 className="font-serif text-[24px] text-brand-ink font-normal">
              Borrowing history
            </h2>

            {borrowingHistory.length === 0 ? (
              <div className="rounded-[14px] border border-brand-border bg-white p-6 flex items-center gap-4">
                <div className="w-10 h-10 rounded-[8px] bg-brand-beige text-brand-teal flex items-center justify-center shrink-0">
                  <History className="w-[18px] h-[18px]" />
                </div>
                <div className="space-y-0.5">
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
              <div className="rounded-[14px] border border-brand-border bg-white divide-y divide-brand-border overflow-hidden">
                {borrowingHistory.map((item) => (
                  <div
                    key={item._id}
                    className="p-5 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <BookCoverGraphic
                        title={item.book.title}
                        author={item.book.author}
                        size="xs"
                      />
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
        <aside className="space-y-5">
          <h2 className="font-serif text-[24px] text-brand-ink font-normal">
            Your account
          </h2>

          {/* Eligibility & Quota Card */}
          <div className="rounded-[14px] border border-brand-border bg-white p-6 space-y-4">
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
              <div className="h-1.5 w-full rounded-full bg-brand-mint overflow-hidden">
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
          <div className="rounded-[14px] border border-brand-border bg-white p-6 space-y-2.5">
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
          <div className="rounded-[14px] bg-brand-beige p-6 space-y-3">
            <h3 className="font-serif text-[21px] text-brand-ink font-normal">
              Quick notice
            </h3>
            <div className="space-y-3 text-[12.5px] leading-[1.6] text-brand-slate">
              <p>Borrow up to 5 books for 14 days.</p>
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
