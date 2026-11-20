import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpDown,
  BookmarkX,
  Check,
  Clock3,
  Copy,
  Search,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  cancelHoldApi,
  getStaffActiveHoldsApi,
  getStaffLoanRecordsApi,
} from '../../api/endpoints';
import { ApiClientError } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import {
  PaginationInfo,
  StaffActiveHoldItem,
  StaffLoanRecordItem,
} from '../../types/api';
import {
  formatBorrowingToday,
  formatCollectionDeadline,
  formatShortBorrowingDate,
} from '../../utils/borrowingDates';

type ActiveTab = 'active' | 'returned' | 'holds';
type ActiveStatusFilter = 'all' | 'overdue' | 'due_soon' | 'on_loan';

function statusBadgeClass(item: StaffLoanRecordItem): string {
  if (item.status === 'Returned') {
    return item.returnCondition && item.returnCondition !== 'Good'
      ? 'bg-red-50 text-[#A1372B]'
      : 'bg-brand-beige text-brand-ink';
  }
  if (item.isOverdue) {
    return 'bg-red-50 text-[#A1372B]';
  }
  if (item.statusBadge.startsWith('Due')) {
    return 'bg-[#FFF4E6] text-[#B55400]';
  }
  return 'bg-[#E8F5EF] text-[#17645F]';
}

export const StaffLoansPage: React.FC = () => {
  const { showToast } = useToast();
  const isMockEnabled = import.meta.env.VITE_USE_MOCK !== 'false';

  const [tab, setTab] = useState<ActiveTab>('active');
  const [queryInput, setQueryInput] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ActiveStatusFilter>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');

  const [loanItems, setLoanItems] = useState<StaffLoanRecordItem[]>([]);
  const [holdItems, setHoldItems] = useState<StaffActiveHoldItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    totalItems: 0,
    currentPage: 1,
    totalPages: 1,
    limit: 6,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [releasingHoldCode, setReleasingHoldCode] = useState<string | null>(
    null,
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [resetTick, setResetTick] = useState(0);

  const handleCopyCode = (code: string) => {
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(code);
    }
    setCopiedId(code);
    showToast(`Copied ${code}`, 'success');
    window.setTimeout(() => {
      setCopiedId((prev) => (prev === code ? null : prev));
    }, 1500);
  };

  const loadRecords = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      if (tab === 'holds') {
        const res = await getStaffActiveHoldsApi({
          q: appliedQuery || undefined,
          page,
          limit: 6,
        });
        setHoldItems(res.items);
        setPagination(res.pagination);
      } else {
        const res = await getStaffLoanRecordsApi({
          tab,
          q: appliedQuery || undefined,
          status: tab === 'active' ? statusFilter : 'all',
          sortBy: tab === 'returned' ? 'returnedAt' : 'dueDate',
          sortOrder: tab === 'returned' ? 'desc' : sortOrder,
          page,
          limit: 6,
        });
        setLoanItems(res.items);
        setPagination(res.pagination);
      }
    } catch (err) {
      setLoadError(
        err instanceof ApiClientError
          ? err.message
          : 'Unable to load circulation records.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [tab, appliedQuery, statusFilter, sortOrder, page, resetTick]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  useEffect(() => {
    const handleReset = () => {
      setQueryInput('');
      setAppliedQuery('');
      setStatusFilter('all');
      setPage(1);
      setLoadError(null);
      setResetTick((t) => t + 1);
    };
    window.addEventListener('mock-db-reset', handleReset);
    return () => window.removeEventListener('mock-db-reset', handleReset);
  }, []);

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

  const handleSwitchTab = (nextTab: ActiveTab) => {
    setTab(nextTab);
    setPage(1);
    setStatusFilter('all');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setAppliedQuery(queryInput.trim());
  };

  const handleQuickFilter = (qText: string, nextTab?: ActiveTab) => {
    if (nextTab && nextTab !== tab) {
      setTab(nextTab);
    }
    setQueryInput(qText);
    setAppliedQuery(qText);
    setPage(1);
  };

  const handleReleaseHold = async (holdCode: string) => {
    setReleasingHoldCode(holdCode);
    try {
      const res = await cancelHoldApi(holdCode);
      showToast(
        res.message ||
          `Hold ${holdCode} released and copy returned to available stock.`,
        'success',
      );
      await loadRecords();
    } catch (err) {
      const msg =
        err instanceof ApiClientError
          ? err.message
          : 'Unable to release this hold.';
      showToast(msg, 'error');
    } finally {
      setReleasingHoldCode(null);
    }
  };

  const startIdx =
    pagination.totalItems === 0
      ? 0
      : (pagination.currentPage - 1) * pagination.limit + 1;
  const endIdx = Math.min(
    pagination.totalItems,
    pagination.currentPage * pagination.limit,
  );

  return (
    <div className="pt-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[13px] text-brand-slate">
        <span>
          Staff panel / Records /{' '}
          {tab === 'active'
            ? 'Active loans'
            : tab === 'returned'
              ? 'Returned history'
              : 'Active holds'}
        </span>
        <span>{formatBorrowingToday()}</span>
      </div>

      <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <span className="w-11 h-11 rounded-[11px] bg-[#7C3AED] text-white flex items-center justify-center shrink-0">
            <Clock3 className="w-5 h-5 stroke-[1.8]" />
          </span>
          <div>
            <h1 className="font-serif text-[32px] leading-[40px] font-semibold text-brand-ink">
              Records
            </h1>
            <p className="mt-1 text-[14px] text-brand-slate">
              View active loans, returned history, and active holds across the library.
            </p>
          </div>
        </div>

        <Link
          to="/staff"
          className="h-10 px-4 rounded-md border border-brand-border bg-white inline-flex items-center gap-2 text-[13px] font-semibold text-[#7C3AED] hover:border-[#7C3AED] shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to home</span>
        </Link>
      </div>

      <section className="mt-6 rounded-xl border border-brand-border border-t-2 border-t-[#7C3AED] bg-white p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-[20px] font-semibold text-brand-ink">
              Loan records
            </h2>
            <p className="mt-0.5 text-[13px] text-brand-slate">
              One record per physical copy. Returned loans remain in history.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="inline-flex rounded-lg border border-brand-border bg-brand-canvas p-1 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => handleSwitchTab('active')}
              className={`h-8 px-3.5 rounded-md text-[13px] font-semibold transition-colors ${
                tab === 'active'
                  ? 'bg-white text-[#7C3AED] shadow-sm'
                  : 'text-brand-slate hover:text-brand-ink'
              }`}
            >
              Active loans
            </button>
            <button
              type="button"
              onClick={() => handleSwitchTab('returned')}
              className={`h-8 px-3.5 rounded-md text-[13px] font-semibold transition-colors ${
                tab === 'returned'
                  ? 'bg-white text-[#7C3AED] shadow-sm'
                  : 'text-brand-slate hover:text-brand-ink'
              }`}
            >
              Returned history
            </button>
            <button
              type="button"
              onClick={() => handleSwitchTab('holds')}
              className={`h-8 px-3.5 rounded-md text-[13px] font-semibold transition-colors ${
                tab === 'holds'
                  ? 'bg-white text-[#7C3AED] shadow-sm'
                  : 'text-brand-slate hover:text-brand-ink'
              }`}
            >
              Active holds
            </button>
          </div>
        </div>

        {/* Search & Filter Row */}
        <form
          onSubmit={handleSearchSubmit}
          className={`mt-4 grid grid-cols-1 gap-3 ${
            tab === 'active'
              ? 'md:grid-cols-[1fr_200px_auto]'
              : 'md:grid-cols-[1fr_auto]'
          }`}
        >
          <div className="relative">
            <Search className="w-4 h-4 text-brand-slate absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder={
                tab === 'holds'
                  ? 'Search hold code, student name, student ID, copy ID or book title'
                  : 'Search student name, student ID, copy ID or book title'
              }
              className="w-full h-10 rounded-md border border-brand-border pl-9 pr-3 text-[13px] focus:outline-none focus:border-brand-teal"
            />
          </div>

          {tab === 'active' && (
            <select
              aria-label="Loan status filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as ActiveStatusFilter);
                setPage(1);
              }}
              className="h-10 rounded-md border border-brand-border bg-white px-3 text-[13px] focus:outline-none focus:border-brand-teal"
            >
              <option value="all">Status: All</option>
              <option value="overdue">Status: Overdue</option>
              <option value="due_soon">Status: Due soon (≤ 2 days)</option>
              <option value="on_loan">Status: On loan</option>
            </select>
          )}

          <button
            type="submit"
            className="h-10 px-5 rounded-md bg-[#7C3AED] hover:bg-[#6D28D9] text-[13px] font-semibold text-white transition-colors"
          >
            Search
          </button>
        </form>

        {/* Demo Quick-Filter Helper */}
        {isMockEnabled && (
          <div className="mt-3 rounded-lg border border-brand-border bg-brand-canvas/60 px-3.5 py-2.5 flex flex-wrap items-center gap-2 text-[12px]">
            <span className="inline-flex items-center gap-1.5 font-medium text-brand-ink mr-1">
              <Sparkles className="w-3.5 h-3.5 text-brand-teal" />
              <span>Demo filters:</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                handleQuickFilter('');
              }}
              className="px-2.5 py-1 rounded bg-white border border-brand-border text-brand-ink font-medium hover:border-brand-teal transition-colors"
            >
              Show all
            </button>
            <button
              type="button"
              onClick={() => handleQuickFilter('S10428', 'active')}
              className="px-2.5 py-1 rounded bg-brand-mint text-brand-teal font-semibold hover:bg-brand-teal hover:text-white transition-colors"
            >
              Maya Chen · S10428
            </button>
            <button
              type="button"
              onClick={() => handleQuickFilter('S10312', 'active')}
              className="px-2.5 py-1 rounded bg-brand-amberSurface text-brand-amberText font-medium hover:opacity-90 transition-opacity"
            >
              Oliver Brown · S10312 (Overdue)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFilter('WB-00422', 'returned')}
              className="px-2.5 py-1 rounded bg-white border border-brand-border text-brand-ink font-medium hover:border-brand-teal transition-colors"
            >
              Returned · WB-00422
            </button>
          </div>
        )}

        {/* Count & Sort Header */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[12.5px] text-brand-slate">
          <span>
            {pagination.totalItems}{' '}
            {tab === 'active'
              ? pagination.totalItems === 1
                ? 'active loan'
                : 'active loans'
              : tab === 'returned'
                ? pagination.totalItems === 1
                  ? 'returned loan'
                  : 'returned loans'
                : pagination.totalItems === 1
                  ? 'active hold'
                  : 'active holds'}
          </span>

          {tab === 'active' ? (
            <button
              type="button"
              onClick={() =>
                setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
              }
              className="inline-flex items-center gap-1 font-medium text-[#7C3AED] hover:underline"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>
                Sorted by due date {sortOrder === 'asc' ? '↑' : '↓'}
              </span>
            </button>
          ) : tab === 'returned' ? (
            <span>Sorted by returned date ↓</span>
          ) : (
            <span>Uncollected holds can be released back to the shelf</span>
          )}
        </div>

        {loadError && (
          <div
            role="alert"
            className="mt-4 rounded-md bg-red-50 border border-red-200 px-3.5 py-2.5 text-[13px] text-red-800 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{loadError}</span>
          </div>
        )}

        {/* Table Content */}
        {tab === 'holds' ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border text-[11px] font-semibold tracking-wider text-brand-slate uppercase">
                  <th className="py-3 pl-3 pr-4">Hold ID</th>
                  <th className="py-3 px-4">Book</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Requested</th>
                  <th className="py-3 px-4">Collect By</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 pl-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border text-[13px]">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-14 text-center text-brand-slate"
                    >
                      Loading active holds…
                    </td>
                  </tr>
                ) : holdItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-14 text-center text-brand-slate"
                    >
                      No active hold requests found.
                    </td>
                  </tr>
                ) : (
                  holdItems.map((hold) => {
                    const deadline = formatCollectionDeadline(hold.collectBy);
                    return (
                      <tr
                        key={hold._id}
                        className={`group transition-colors ${
                          hold.isPastDeadline
                            ? 'bg-red-50/35 hover:bg-red-50/60'
                            : 'hover:bg-brand-canvas/40'
                        }`}
                      >
                        <td
                          className={`py-3.5 pl-3 pr-4 align-top whitespace-nowrap border-l-[3px] ${
                            hold.isPastDeadline
                              ? 'border-l-[#A1372B]'
                              : 'border-l-transparent'
                          }`}
                        >
                          <div className="inline-flex items-center gap-1.5">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md border border-[#C6D7FF] bg-[#EDF2FF] font-mono text-[12px] font-semibold text-[#254EDB]">
                              {hold.holdCode}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(hold.holdCode)}
                              title={`Copy ${hold.holdCode}`}
                              aria-label={`Copy hold ID ${hold.holdCode}`}
                              className="p-1 rounded text-brand-slate opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-brand-canvas hover:text-brand-ink transition-all"
                            >
                              {copiedId === hold.holdCode ? (
                                <Check className="w-3.5 h-3.5 text-[#17645F]" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <p className="mt-1 font-mono text-[11.5px] text-brand-slate">
                            Copy {hold.copy.copyCode}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 align-top">
                          <p className="font-semibold text-[14px] text-brand-ink leading-snug">
                            {hold.book.title}
                          </p>
                          <p className="mt-0.5 text-[12px] text-brand-slate">
                            {hold.book.author}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 align-top">
                          <p className="font-semibold text-brand-ink">
                            {hold.student.fullName}
                          </p>
                          <p className="text-[12px] font-mono text-brand-slate">
                            {hold.student.accountId}
                            {hold.student.yearGroup
                              ? ` · ${hold.student.yearGroup}`
                              : ''}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 align-top text-brand-slate tabular-nums whitespace-nowrap">
                          {formatShortBorrowingDate(hold.requestedAt)}
                        </td>
                        <td className="py-3.5 px-4 align-top tabular-nums whitespace-nowrap">
                          <p
                            className={`font-semibold ${
                              hold.isPastDeadline
                                ? 'text-[#A1372B]'
                                : 'text-brand-ink'
                            }`}
                          >
                            {deadline.date}
                          </p>
                          {deadline.time && (
                            <p className="text-[12px] text-brand-slate">
                              {deadline.time}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${
                              hold.isPastDeadline
                                ? 'bg-red-50 text-[#A1372B]'
                                : 'bg-[#EDF2FF] text-[#315FF4]'
                            }`}
                          >
                            {hold.isPastDeadline
                              ? 'Past pickup deadline'
                              : 'Ready at counter'}
                          </span>
                        </td>
                        <td className="py-3.5 pl-4 align-top text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <Link
                              to={`/staff/issue?studentAccountId=${encodeURIComponent(
                                hold.student.accountId,
                              )}&copyCode=${encodeURIComponent(
                                hold.copy.copyCode,
                              )}`}
                              className="h-8 px-3 rounded-md border border-[#F5D0A9] bg-[#FFF4E6] hover:bg-[#FFE8CC] inline-flex items-center text-[12px] font-semibold text-[#D96C00] transition-colors"
                            >
                              Issue
                            </Link>
                            <button
                              type="button"
                              disabled={releasingHoldCode === hold.holdCode}
                              onClick={() =>
                                void handleReleaseHold(hold.holdCode)
                              }
                              className="h-8 px-3 rounded-md border border-red-200 bg-white inline-flex items-center gap-1 text-[12px] font-semibold text-[#A1372B] hover:bg-red-50 disabled:opacity-50 transition-colors"
                            >
                              <BookmarkX className="w-3.5 h-3.5" />
                              <span>
                                {releasingHoldCode === hold.holdCode
                                  ? 'Releasing…'
                                  : 'Release'}
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border text-[11px] font-semibold tracking-wider text-brand-slate uppercase">
                  <th className="py-3 pl-3 pr-4">Borrow ID</th>
                  <th className="py-3 px-4">Book</th>
                  <th className="py-3 px-4">Borrower</th>
                  <th className="py-3 px-4">Borrowed</th>
                  <th className="py-3 px-4">
                    {tab === 'returned' ? 'Due / Returned' : 'Due'}
                  </th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 pl-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border text-[13px]">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-14 text-center text-brand-slate"
                    >
                      Loading loan records…
                    </td>
                  </tr>
                ) : loanItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-14 text-center text-brand-slate"
                    >
                      No matching loan records found.
                    </td>
                  </tr>
                ) : (
                  loanItems.map((item) => {
                    const isUrgent =
                      item.status === 'Active' && item.isOverdue;
                    return (
                      <tr
                        key={item._id}
                        className={`group transition-colors ${
                          isUrgent
                            ? 'bg-red-50/35 hover:bg-red-50/60'
                            : 'hover:bg-brand-canvas/40'
                        }`}
                      >
                        <td
                          className={`py-3.5 pl-3 pr-4 align-top whitespace-nowrap border-l-[3px] ${
                            isUrgent
                              ? 'border-l-[#A1372B]'
                              : 'border-l-transparent'
                          }`}
                        >
                          <div className="inline-flex items-center gap-1.5">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md border border-[#DDD0FF] bg-[#F2EEFF] font-mono text-[12px] font-semibold text-[#6D28D9]">
                              {item.borrowCode}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(item.borrowCode)}
                              title={`Copy ${item.borrowCode}`}
                              aria-label={`Copy borrow ID ${item.borrowCode}`}
                              className="p-1 rounded text-brand-slate opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-brand-canvas hover:text-brand-ink transition-all"
                            >
                              {copiedId === item.borrowCode ? (
                                <Check className="w-3.5 h-3.5 text-[#17645F]" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <p className="mt-1 font-mono text-[11.5px] text-brand-slate">
                            Copy {item.copy.copyCode}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 align-top">
                          <p className="font-semibold text-[14px] text-brand-ink leading-snug">
                            {item.book.title}
                          </p>
                          <p className="mt-0.5 text-[12px] text-brand-slate">
                            {item.book.author}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 align-top">
                          <p className="font-semibold text-brand-ink">
                            {item.borrower.fullName}
                          </p>
                          <p className="text-[12px] font-mono text-brand-slate">
                            {item.borrower.accountId}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 align-top text-brand-slate tabular-nums whitespace-nowrap">
                          {formatShortBorrowingDate(item.borrowedAt)}
                        </td>
                        <td className="py-3.5 px-4 align-top tabular-nums whitespace-nowrap">
                          <p
                            className={`font-semibold ${
                              isUrgent ? 'text-[#A1372B]' : 'text-brand-ink'
                            }`}
                          >
                            {formatShortBorrowingDate(item.dueDate)}
                          </p>
                          {item.status === 'Returned' && item.returnedAt && (
                            <p className="text-[12px] text-brand-teal">
                              Returned{' '}
                              {formatShortBorrowingDate(item.returnedAt)}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${statusBadgeClass(
                              item,
                            )}`}
                          >
                            {item.status === 'Returned'
                              ? 'Returned'
                              : item.statusBadge}
                          </span>
                          {item.status === 'Returned' &&
                            item.returnCondition && (
                              <p
                                className={`mt-1 text-[11.5px] font-medium ${
                                  item.returnCondition === 'Good'
                                    ? 'text-brand-slate'
                                    : 'text-[#A1372B]'
                                }`}
                              >
                                Condition: {item.returnCondition}
                              </p>
                            )}
                        </td>
                        <td className="py-3.5 pl-4 align-top text-right whitespace-nowrap">
                          {item.status === 'Active' ? (
                            <Link
                              to={`/staff/return?copyCode=${encodeURIComponent(
                                item.copy.copyCode,
                              )}`}
                              className="h-8 px-3.5 rounded-md border border-[#C6D7FF] bg-[#EDF2FF] hover:bg-[#DCE7FF] inline-flex items-center justify-center text-[12px] font-semibold text-[#315FF4] transition-colors"
                            >
                              Return
                            </Link>
                          ) : (
                            <span className="text-[12px] text-brand-slate">
                              Closed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination & Footer Rules */}
        <div className="mt-5 pt-4 border-t border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[12px] text-brand-slate">
          <span>
            Showing {startIdx}–{endIdx} of {pagination.totalItems} · Loan limit: 5 per student · Default period: 14 days · Overdue books or unpaid fines block new borrowing.
          </span>

          <div className="flex items-center gap-2 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                commitPageInput();
              }}
              className="inline-flex items-center gap-1.5"
            >
              <label htmlFor="staff-loans-page-input">Page</label>
              <input
                id="staff-loans-page-input"
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
              Previous
            </button>
            <button
              type="button"
              disabled={pagination.currentPage >= pagination.totalPages}
              onClick={() =>
                setPage((p) => Math.min(pagination.totalPages, p + 1))
              }
              className="h-8 px-3 rounded border border-brand-border font-semibold text-brand-teal disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
