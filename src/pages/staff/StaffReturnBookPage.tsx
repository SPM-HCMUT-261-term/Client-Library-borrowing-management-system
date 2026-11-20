import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  BookCheck,
  Check,
  CheckCircle2,
  Info,
  Search,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  findActiveLoanByCopyApi,
  returnBookApi,
} from '../../api/endpoints';
import { ApiClientError } from '../../api/client';
import { BookCoverGraphic } from '../../components/BookCoverGraphic';
import { useToast } from '../../context/ToastContext';
import {
  ActiveLoanLookup,
  CopyCondition,
  ReturnDetail,
} from '../../types/api';
import {
  formatBorrowingToday,
  formatShortBorrowingDate,
} from '../../utils/borrowingDates';

const CONDITION_OPTIONS: Array<{
  value: CopyCondition;
  label: string;
  helper: string;
}> = [
  {
    value: 'Good',
    label: 'Good / normal wear',
    helper: 'Copy returns to open circulation on its home shelf.',
  },
  {
    value: 'Damaged',
    label: 'Damaged',
    helper: 'Flags copy for staff review and keeps it unavailable.',
  },
  {
    value: 'Lost',
    label: 'Lost',
    helper: 'Marks copy as lost and removes it from available stock.',
  },
];

function conditionDisplayLabel(cond: CopyCondition): string {
  return cond === 'Good' ? 'Good / normal wear' : cond;
}

export const StaffReturnBookPage: React.FC = () => {
  const { showToast } = useToast();
  const isMockEnabled = import.meta.env.VITE_USE_MOCK !== 'false';
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCopyParam = searchParams.get('copyCode') || '';

  const [copyInput, setCopyInput] = useState(initialCopyParam);
  const [lookup, setLookup] = useState<ActiveLoanLookup | null>(null);
  const [isFinding, setIsFinding] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [condition, setCondition] = useState<CopyCondition>('Good');
  const [conditionNote, setConditionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);
  const [completedReturn, setCompletedReturn] = useState<{
    detail: ReturnDetail;
    book: ActiveLoanLookup['book'];
    borrowerInitials: string;
    borrowerYearGroup: string | null;
    maxLoansLimit: number;
  } | null>(null);

  const performLookup = useCallback(
    async (rawCode: string) => {
      const target = rawCode.trim();
      if (!target) {
        setLookupError('Please enter a physical copy ID / barcode.');
        return;
      }

      setIsFinding(true);
      setLookupError(null);
      setReturnError(null);
      setCompletedReturn(null);

      try {
        const result = await findActiveLoanByCopyApi(target);
        setLookup(result);
        setCopyInput(result.copy.copyCode);
        setCondition('Good');
        setConditionNote('');
      } catch (err) {
        setLookup(null);
        const msg =
          err instanceof ApiClientError
            ? err.message
            : 'Unable to find an active loan for that copy.';
        setLookupError(msg);
        showToast(msg, 'error');
      } finally {
        setIsFinding(false);
      }
    },
    [showToast],
  );

  useEffect(() => {
    if (initialCopyParam) {
      void performLookup(initialCopyParam);
    }
  }, [initialCopyParam, performLookup]);

  useEffect(() => {
    const handleReset = () => {
      setCompletedReturn(null);
      setLookup(null);
      setCopyInput('');
      setLookupError(null);
      setReturnError(null);
      setCondition('Good');
      setConditionNote('');
    };
    window.addEventListener('mock-db-reset', handleReset);
    return () => window.removeEventListener('mock-db-reset', handleReset);
  }, []);

  const handleFindSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void performLookup(copyInput);
  };

  const handleConfirmReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookup) return;

    setIsSubmitting(true);
    setReturnError(null);

    try {
      const res = await returnBookApi(lookup.loan.borrowCode, {
        condition,
        conditionNote: conditionNote.trim() || null,
      });
      setCompletedReturn({
        detail: res.data,
        book: lookup.book,
        borrowerInitials: lookup.borrower.initials,
        borrowerYearGroup: lookup.borrower.yearGroup,
        maxLoansLimit: lookup.borrower.maxLoansLimit,
      });
      setLookup(null);
      if (searchParams.has('copyCode')) {
        setSearchParams({});
      }
      showToast(
        res.message ||
          `Return confirmed for ${res.data.copy.copyCode} (${res.data.borrowCode}).`,
        'success',
      );
    } catch (err) {
      const msg =
        err instanceof ApiClientError
          ? err.message
          : 'Unable to confirm this book return.';
      setReturnError(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForNextReturn = () => {
    setCompletedReturn(null);
    setLookup(null);
    setCopyInput('');
    setLookupError(null);
    setReturnError(null);
    setCondition('Good');
    setConditionNote('');
    if (searchParams.has('copyCode')) {
      setSearchParams({});
    }
  };

  const previewNewState = condition === 'Good' ? 'Available' : condition;
  const borrowerFirstName = lookup
    ? lookup.borrower.fullName.split(' ')[0] || lookup.borrower.fullName
    : '';

  const returnStep = completedReturn ? 3 : lookup ? 2 : 1;

  return (
    <div className="pt-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[13px] text-brand-slate">
        <span>Staff panel / Return book</span>
        <span>{formatBorrowingToday()}</span>
      </div>

      {/* Crisp Blue Counter Hero Banner */}
      <div className="mt-3 rounded-2xl border border-[#C6D7FF] bg-[#EDF2FF] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <span className="w-12 h-12 rounded-[12px] bg-[#3B6EF5] text-white flex items-center justify-center shrink-0 shadow-sm">
              <ArrowDownLeft className="w-6 h-6 stroke-[2]" />
            </span>
            <div>
              <h1 className="font-serif text-[30px] leading-[38px] font-semibold text-brand-ink">
                Return book
              </h1>
              <p className="mt-0.5 text-[14px] text-[#2244A8]">
                Find the physical copy and check its condition before confirming the return.
              </p>
            </div>
          </div>

          <Link
            to="/staff"
            className="h-10 px-4 rounded-md border border-[#BBD0FF] bg-white inline-flex items-center gap-2 text-[13px] font-semibold text-[#315FF4] hover:border-[#315FF4] shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to home</span>
          </Link>
        </div>

        {/* 2-Step Check-in Progress Strip */}
        <ol className="mt-5 pt-4 border-t border-[#D3E1FF] grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[12.5px]">
          {[
            { num: 1, label: 'Scan or find copy barcode' },
            { num: 2, label: 'Inspect condition & confirm return' },
          ].map((s) => {
            const done = returnStep > s.num;
            const active = returnStep === s.num;
            return (
              <li
                key={s.num}
                className={`rounded-lg px-3.5 py-2 flex items-center gap-2.5 border transition-colors ${
                  active
                    ? 'bg-white border-[#3B6EF5] text-[#254EDB] font-semibold shadow-sm'
                    : done
                      ? 'bg-[#E8F5EF] border-[#B7DFCC] text-[#17645F] font-semibold'
                      : 'bg-white/60 border-[#D3E1FF] text-brand-slate'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${
                    done
                      ? 'bg-[#17645F] text-white'
                      : active
                        ? 'bg-[#3B6EF5] text-white'
                        : 'bg-[#D3E1FF] text-[#2244A8]'
                  }`}
                >
                  {done ? <Check className="w-3 h-3 stroke-[2.5]" /> : s.num}
                </span>
                <span>{s.label}</span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Step 1: Find the Copy Card */}
      <section
        className={`mt-6 rounded-xl border bg-white p-6 transition-colors ${
          returnStep === 1
            ? 'border-[#3B6EF5]/70 ring-1 ring-[#3B6EF5]/15'
            : 'border-brand-border'
        }`}
      >
        <h2 className="font-serif text-[20px] font-semibold text-brand-ink">
          Find the copy
        </h2>
        <p className="mt-0.5 text-[13px] text-brand-slate">
          Only an active loan can be checked in. A copy already returned will not be returned again.
        </p>

        <form
          onSubmit={handleFindSubmit}
          className="mt-4 flex flex-col sm:flex-row gap-3 max-w-[640px]"
        >
          <div className="flex-1">
            <label htmlFor="return-copy-code" className="sr-only">
              Copy ID / barcode
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-brand-slate absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="return-copy-code"
                type="text"
                value={copyInput}
                onChange={(e) => setCopyInput(e.target.value)}
                placeholder="Copy ID / barcode (e.g. WB-00632 or WB-00423)"
                className="w-full h-10 rounded-md border border-brand-border pl-9 pr-3 text-[13px] font-mono focus:outline-none focus:border-brand-teal"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isFinding}
            className="h-10 px-5 rounded-md bg-[#315FF4] hover:bg-[#254EDB] text-[13px] font-semibold text-white disabled:opacity-60 shrink-0"
          >
            {isFinding ? 'Finding…' : 'Find loan'}
          </button>
        </form>

        {isMockEnabled && (
          <div className="mt-3 rounded-lg border border-brand-border bg-brand-canvas/60 px-3.5 py-2.5 flex flex-wrap items-center gap-2 text-[12px]">
            <span className="inline-flex items-center gap-1.5 font-medium text-brand-ink mr-1">
              <Sparkles className="w-3.5 h-3.5 text-brand-teal" />
              <span>Demo copies:</span>
            </span>
            <button
              type="button"
              disabled={isFinding}
              onClick={() => void performLookup('WB-00632')}
              className="px-2.5 py-1 rounded bg-brand-mint text-brand-teal font-semibold hover:bg-brand-teal hover:text-white transition-colors disabled:opacity-50"
            >
              WB-00632 (On time · Maya)
            </button>
            <button
              type="button"
              disabled={isFinding}
              onClick={() => void performLookup('WB-00216')}
              className="px-2.5 py-1 rounded bg-brand-mint text-brand-teal font-semibold hover:bg-brand-teal hover:text-white transition-colors disabled:opacity-50"
            >
              WB-00216 (On time · Maya)
            </button>
            <button
              type="button"
              disabled={isFinding}
              onClick={() => void performLookup('WB-00318')}
              className="px-2.5 py-1 rounded bg-brand-amberSurface text-brand-amberText font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              WB-00318 (Overdue · Oliver)
            </button>
            <button
              type="button"
              disabled={isFinding}
              onClick={() => void performLookup('WB-00423')}
              className="px-2.5 py-1 rounded bg-white border border-brand-border text-brand-ink font-medium hover:border-brand-teal transition-colors disabled:opacity-50"
            >
              WB-00423 (Due tomorrow · Amira)
            </button>
            <button
              type="button"
              disabled={isFinding}
              onClick={() => void performLookup('WB-00422')}
              className="px-2.5 py-1 rounded bg-gray-100 text-brand-slate font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              WB-00422 (Not borrowed · 404)
            </button>
          </div>
        )}

        {lookupError && (
          <div
            role="alert"
            className="mt-4 rounded-md bg-red-50 border border-red-200 px-3.5 py-2.5 text-[13px] text-red-800 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{lookupError}</span>
          </div>
        )}
      </section>

      {returnError && (
        <div
          role="alert"
          className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800 flex items-center gap-2.5"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{returnError}</span>
        </div>
      )}

      {/* Friendly Empty State before a copy is looked up */}
      {!lookup && !completedReturn && !lookupError && (
        <section className="mt-6 rounded-xl border border-dashed border-[#C6D7FF] bg-white/80 p-10 text-center">
          <span className="w-12 h-12 rounded-full bg-[#EDF2FF] text-[#315FF4] inline-flex items-center justify-center">
            <BookCheck className="w-6 h-6" />
          </span>
          <h3 className="mt-3 font-serif text-[20px] font-semibold text-brand-ink">
            Ready to check in a book
          </h3>
          <p className="mt-1 text-[13.5px] text-brand-slate max-w-md mx-auto">
            Scan or type the physical copy barcode above to load its active loan, inspect the book&rsquo;s condition, and return it to inventory.
          </p>
        </section>
      )}

      {/* Completed Return Receipt State */}
      {completedReturn && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
          <section className="rounded-xl border border-brand-border bg-white p-6 space-y-5">
            <div className="rounded-xl border border-brand-teal/30 bg-brand-mint/60 px-4 py-3.5 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-brand-teal shrink-0 mt-0.5" />
              <div>
                <p className="text-[14px] font-semibold text-brand-teal">
                  Return confirmed · {completedReturn.detail.borrowCode} closed in returned history
                </p>
                <p className="mt-0.5 text-[13px] text-brand-ink/80">
                  Copy {completedReturn.detail.copy.copyCode} is now{' '}
                  <span className="font-semibold">
                    {completedReturn.detail.copy.newState}
                  </span>
                  {completedReturn.detail.copy.newState === 'Available'
                    ? ` — return to shelf ${completedReturn.detail.copy.homeLocation}.`
                    : ' — set aside for staff review.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <BookCoverGraphic
                title={completedReturn.book.title}
                author={completedReturn.book.author}
                coverKey={completedReturn.book._id}
                size="sm"
              />
              <div className="space-y-1">
                <p className="font-serif text-[22px] font-semibold text-brand-ink">
                  {completedReturn.book.title}
                </p>
                <p className="text-[13.5px] text-brand-slate">
                  {completedReturn.book.author}
                </p>
                <p className="text-[13px] font-mono font-semibold text-brand-teal">
                  Copy {completedReturn.detail.copy.copyCode} ·{' '}
                  {completedReturn.detail.borrowCode}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-brand-border">
              <button
                type="button"
                onClick={handleResetForNextReturn}
                className="h-10 px-5 rounded-md bg-brand-teal hover:bg-brand-tealHover text-white text-[13px] font-semibold"
              >
                Return another book
              </button>
              <Link
                to="/staff"
                className="h-10 px-4 rounded-md border border-brand-border text-[13px] font-semibold text-brand-teal hover:border-brand-teal inline-flex items-center"
              >
                Back to staff home
              </Link>
            </div>
          </section>

          <aside className="rounded-xl border border-brand-border bg-white p-6 space-y-4">
            <h2 className="font-serif text-[20px] font-semibold text-brand-ink">
              Return detail
            </h2>
            <dl className="divide-y divide-brand-border text-[13px]">
              <div className="py-2.5 flex items-center justify-between gap-3">
                <dt className="text-brand-slate">Borrow entry</dt>
                <dd className="font-mono font-semibold text-brand-ink">
                  {completedReturn.detail.borrowCode}
                </dd>
              </div>
              <div className="py-2.5 flex items-center justify-between gap-3">
                <dt className="text-brand-slate">Borrower</dt>
                <dd className="font-semibold text-brand-ink text-right">
                  {completedReturn.detail.borrower.fullName} ·{' '}
                  {completedReturn.detail.borrower.accountId}
                </dd>
              </div>
              <div className="py-2.5 flex items-center justify-between gap-3">
                <dt className="text-brand-slate">Borrowed → Due</dt>
                <dd className="font-medium text-brand-ink text-right">
                  {formatShortBorrowingDate(completedReturn.detail.borrowedAt)}{' '}
                  → {formatShortBorrowingDate(completedReturn.detail.dueDate)}
                </dd>
              </div>
              <div className="py-2.5 flex items-center justify-between gap-3">
                <dt className="text-brand-slate">Returned</dt>
                <dd className="font-semibold text-brand-teal text-right">
                  {formatShortBorrowingDate(completedReturn.detail.returnedAt)}
                </dd>
              </div>
              <div className="py-2.5 flex items-center justify-between gap-3">
                <dt className="text-brand-slate">Condition</dt>
                <dd className="font-semibold text-brand-ink text-right">
                  {conditionDisplayLabel(
                    completedReturn.detail.returnCondition,
                  )}
                </dd>
              </div>
              <div className="py-2.5 flex items-center justify-between gap-3">
                <dt className="text-brand-slate">Copy state</dt>
                <dd className="font-semibold text-brand-ink text-right">
                  {completedReturn.detail.copy.newState} ·{' '}
                  {completedReturn.detail.copy.homeLocation}
                </dd>
              </div>
              <div className="py-2.5 flex items-center justify-between gap-3">
                <dt className="text-brand-slate">Loan count after return</dt>
                <dd className="font-semibold text-brand-teal text-right">
                  {completedReturn.detail.borrower.loansBefore} →{' '}
                  {completedReturn.detail.borrower.loansAfter} active loans
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      )}

      {/* Active Loan Found & Return Condition Form (Figma 53:451) */}
      {lookup && (
        <form
          onSubmit={(e) => void handleConfirmReturn(e)}
          className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start"
        >
          {/* Left Column: Active Loan Card + Return Condition Card */}
          <div className="space-y-6">
            {/* Active Loan Found Card */}
            <section className="rounded-xl border border-brand-border bg-white p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-mint text-brand-teal text-[12px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-teal" />
                  <span>Active loan found</span>
                </span>

                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold ${
                    lookup.loan.isOverdue
                      ? 'bg-red-50 text-[#A1372B]'
                      : 'bg-[#E8F5EF] text-[#17645F]'
                  }`}
                >
                  {lookup.loan.timingBadge}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <BookCoverGraphic
                  title={lookup.book.title}
                  author={lookup.book.author}
                  coverKey={lookup.book._id}
                  size="sm"
                />
                <div className="space-y-1.5">
                  <h3 className="font-serif text-[24px] leading-snug font-semibold text-brand-ink">
                    {lookup.book.title}
                  </h3>
                  <p className="text-[14px] text-brand-slate">
                    {lookup.book.author}
                  </p>
                  <p className="text-[13px] font-mono font-semibold text-brand-teal pt-0.5">
                    Copy {lookup.copy.copyCode} · {lookup.loan.borrowCode}
                  </p>
                </div>
              </div>

              {/* Borrower Strip */}
              <div className="rounded-xl border border-brand-border bg-brand-canvas/70 p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-brand-mint text-brand-teal font-bold text-[13px] flex items-center justify-center shrink-0">
                    {lookup.borrower.initials}
                  </span>
                  <div>
                    <p className="font-semibold text-[15px] text-brand-ink">
                      {lookup.borrower.fullName}
                    </p>
                    <p className="text-[12.5px] text-brand-slate">
                      Student ID:{' '}
                      <span className="font-mono font-medium text-brand-ink">
                        {lookup.borrower.accountId}
                      </span>
                      {lookup.borrower.yearGroup
                        ? ` · ${lookup.borrower.yearGroup}`
                        : ''}
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-brand-border text-[12px] font-semibold text-brand-ink">
                  Loaning {lookup.borrower.activeLoansBeforeReturn} out of{' '}
                  {lookup.borrower.maxLoansLimit}
                </span>
              </div>

              {/* 3-Column Date Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border border-brand-border p-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-slate">
                    Borrowed
                  </p>
                  <p className="mt-1 text-[14px] font-semibold text-brand-ink">
                    {formatShortBorrowingDate(lookup.loan.borrowedAt)}
                  </p>
                </div>
                <div className="rounded-lg border border-brand-border p-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-slate">
                    Due
                  </p>
                  <p
                    className={`mt-1 text-[14px] font-semibold ${
                      lookup.loan.isOverdue
                        ? 'text-[#A1372B]'
                        : 'text-brand-ink'
                    }`}
                  >
                    {formatShortBorrowingDate(lookup.loan.dueDate)}
                  </p>
                </div>
                <div className="rounded-lg border border-brand-teal/30 bg-brand-mint/30 p-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-teal">
                    Returning today
                  </p>
                  <p className="mt-1 text-[14px] font-semibold text-brand-teal">
                    {formatShortBorrowingDate(lookup.loan.returningToday)}
                  </p>
                </div>
              </div>
            </section>

            {/* Return Condition Card */}
            <section className="rounded-xl border border-brand-border bg-white p-6 space-y-4">
              <div>
                <h2 className="font-serif text-[20px] font-semibold text-brand-ink">
                  Return condition
                </h2>
                <p className="mt-0.5 text-[13px] text-brand-slate">
                  Inspect the copy at the counter. Condition is saved with the return.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {CONDITION_OPTIONS.map((opt) => {
                  const selected = condition === opt.value;
                  const tone =
                    opt.value === 'Good'
                      ? {
                          selectedCard: 'border-[#17645F] bg-[#E8F5EF]/70 ring-1 ring-[#17645F]/20',
                          iconWrap: 'bg-[#E8F5EF] text-[#17645F]',
                          Icon: CheckCircle2,
                        }
                      : opt.value === 'Damaged'
                        ? {
                            selectedCard: 'border-[#E97700] bg-[#FFF4E6]/80 ring-1 ring-[#E97700]/20',
                            iconWrap: 'bg-[#FFF4E6] text-[#D96C00]',
                            Icon: AlertTriangle,
                          }
                        : {
                            selectedCard: 'border-[#A1372B] bg-red-50/80 ring-1 ring-[#A1372B]/20',
                            iconWrap: 'bg-red-50 text-[#A1372B]',
                            Icon: XCircle,
                          };
                  const CondIcon = tone.Icon;
                  return (
                    <label
                      key={opt.value}
                      className={`rounded-xl border p-4 cursor-pointer flex flex-col gap-2 transition-all ${
                        selected
                          ? tone.selectedCard
                          : 'border-brand-border bg-white hover:border-brand-slate/50'
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 text-[13.5px] font-semibold text-brand-ink">
                          <input
                            type="radio"
                            name="returnCondition"
                            value={opt.value}
                            checked={selected}
                            onChange={() => setCondition(opt.value)}
                            className="accent-[#315FF4]"
                          />
                          <span>{opt.label}</span>
                        </span>
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${tone.iconWrap}`}
                        >
                          <CondIcon className="w-4 h-4" />
                        </span>
                      </span>
                      <span className="text-[12px] text-brand-slate leading-relaxed">
                        {opt.helper}
                      </span>
                    </label>
                  );
                })}
              </div>

              <div>
                <label
                  htmlFor="return-condition-note"
                  className="block text-[13px] font-semibold text-brand-ink"
                >
                  Condition note{' '}
                  <span className="font-normal text-brand-slate">
                    (optional)
                  </span>
                </label>
                <input
                  id="return-condition-note"
                  type="text"
                  value={conditionNote}
                  onChange={(e) => setConditionNote(e.target.value)}
                  placeholder="No new damage"
                  className="mt-1.5 w-full h-10 rounded-md border border-brand-border px-3 text-[13px] focus:outline-none focus:border-brand-teal"
                />
              </div>

              <div
                className={`rounded-lg border px-4 py-3 text-[12.5px] ${
                  condition === 'Good'
                    ? 'border-brand-teal/30 bg-brand-mint/40 text-brand-ink'
                    : 'border-[#E5B869] bg-[#FFF8EB] text-[#944200]'
                }`}
              >
                <p className="font-semibold">
                  {condition === 'Good'
                    ? 'Copy will become Available'
                    : `Copy will be marked ${condition} and kept unavailable`}
                </p>
                <p className="mt-0.5">
                  {condition === 'Good'
                    ? `No reservation is waiting. Return to ${lookup.copy.homeLocation} after check-in.`
                    : 'Flagged for staff review and excluded from available stock. This does not create or settle a fine.'}
                </p>
              </div>

              <p className="text-[12px] text-brand-slate">
                If Damaged or Lost is selected, flag the copy for staff review and keep it unavailable. This does not create or settle a fine.
              </p>
            </section>
          </div>

          {/* Right Column: Return Detail Summary & Confirm Return Button */}
          <aside className="space-y-4">
            <section className="rounded-xl border border-brand-border bg-white p-6 space-y-4">
              <div>
                <h2 className="font-serif text-[20px] font-semibold text-brand-ink">
                  Return detail
                </h2>
                <p className="mt-0.5 text-[13px] text-brand-slate">
                  {lookup.borrower.activeLoansBeforeReturn} →{' '}
                  {lookup.borrower.activeLoansAfterReturn} active loans for{' '}
                  {borrowerFirstName}
                </p>
              </div>

              <dl className="divide-y divide-brand-border text-[13px]">
                <div className="py-2.5 flex items-center justify-between gap-3">
                  <dt className="text-brand-slate">Borrow entry</dt>
                  <dd className="font-mono font-semibold text-brand-ink">
                    {lookup.loan.borrowCode}
                  </dd>
                </div>
                <div className="py-2.5 flex items-center justify-between gap-3">
                  <dt className="text-brand-slate">Borrower</dt>
                  <dd className="font-semibold text-brand-ink text-right">
                    {lookup.borrower.fullName} · {lookup.borrower.accountId}
                  </dd>
                </div>
                <div className="py-2.5 flex items-center justify-between gap-3">
                  <dt className="text-brand-slate">Borrowed → Due</dt>
                  <dd className="font-medium text-brand-ink text-right">
                    {formatShortBorrowingDate(lookup.loan.borrowedAt)} →{' '}
                    {formatShortBorrowingDate(lookup.loan.dueDate)}
                  </dd>
                </div>
                <div className="py-2.5 flex items-center justify-between gap-3">
                  <dt className="text-brand-slate">Returned</dt>
                  <dd className="font-semibold text-brand-teal text-right">
                    {formatShortBorrowingDate(lookup.loan.returningToday)}
                  </dd>
                </div>
                <div className="py-2.5 flex items-center justify-between gap-3">
                  <dt className="text-brand-slate">Condition</dt>
                  <dd className="font-semibold text-brand-ink text-right">
                    {conditionDisplayLabel(condition)}
                  </dd>
                </div>
                <div className="py-2.5 flex items-center justify-between gap-3">
                  <dt className="text-brand-slate">Copy state</dt>
                  <dd className="font-semibold text-brand-ink text-right">
                    {previewNewState} · {lookup.copy.homeLocation}
                  </dd>
                </div>
                <div className="py-2.5 flex items-center justify-between gap-3">
                  <dt className="text-brand-slate">Loan count after return</dt>
                  <dd className="font-semibold text-brand-teal text-right inline-flex items-center gap-1">
                    <span>{lookup.borrower.activeLoansBeforeReturn}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>
                      {lookup.borrower.activeLoansAfterReturn} active loans
                    </span>
                  </dd>
                </div>
              </dl>

              <div className="rounded-lg border border-brand-border bg-brand-canvas p-3.5 text-[12px] text-brand-slate space-y-1">
                <p className="font-semibold text-brand-ink flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-brand-teal" />
                  <span>Saving in returned history</span>
                </p>
                <p>
                  {lookup.loan.borrowCode} will remain in returned history. The original loan will be closed, not deleted.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-md bg-[#315FF4] hover:bg-[#254EDB] text-white font-semibold text-[13px] disabled:opacity-60 transition-colors"
              >
                {isSubmitting ? 'Confirming return…' : 'Confirm return'}
              </button>
            </section>
          </aside>
        </form>
      )}
    </div>
  );
};
