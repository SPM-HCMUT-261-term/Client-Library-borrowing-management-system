import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookmarkCheck,
  CheckCircle2,
  Info,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  checkCopyForCheckoutApi,
  findStudentForCheckoutApi,
  issueBooksApi,
} from '../../api/endpoints';
import { ApiClientError } from '../../api/client';
import { BookCoverGraphic } from '../../components/BookCoverGraphic';
import { useToast } from '../../context/ToastContext';
import {
  CopyCheckoutCheck,
  IssueTransactionReceipt,
  StudentCheckoutProfile,
} from '../../types/api';
import {
  formatBorrowingToday,
  formatShortBorrowingDate,
} from '../../utils/borrowingDates';

interface SelectedCheckoutCopy extends CopyCheckoutCheck {
  dueDate: string;
}

function normalizeCode(raw: string): string {
  return raw.trim().replace(/[–—]/g, '-').toLowerCase();
}

export const StaffIssueBooksPage: React.FC = () => {
  const { showToast } = useToast();
  const isMockEnabled = import.meta.env.VITE_USE_MOCK !== 'false';

  // Step 1: Student lookup state
  const [studentInput, setStudentInput] = useState('');
  const [studentProfile, setStudentProfile] =
    useState<StudentCheckoutProfile | null>(null);
  const [isFindingStudent, setIsFindingStudent] = useState(false);
  const [studentError, setStudentError] = useState<string | null>(null);

  // Step 2: Copy lookup & selected batch state
  const [copyInput, setCopyInput] = useState('');
  const [isCheckingCopy, setIsCheckingCopy] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [blockedCopyCheck, setBlockedCopyCheck] =
    useState<CopyCheckoutCheck | null>(null);
  const [selectedCopies, setSelectedCopies] = useState<SelectedCheckoutCopy[]>(
    [],
  );

  // Step 3: Confirm modal & Receipt state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<IssueTransactionReceipt | null>(null);

  const handleFindStudent = async (
    e?: React.FormEvent,
    overrideAccountId?: string,
  ) => {
    if (e) e.preventDefault();
    const targetId = (overrideAccountId ?? studentInput).trim();
    if (!targetId) {
      setStudentError('Please enter a student ID from their school card.');
      return;
    }

    setIsFindingStudent(true);
    setStudentError(null);
    setCopyError(null);
    setBlockedCopyCheck(null);
    setIssueError(null);

    try {
      const profile = await findStudentForCheckoutApi(targetId);
      // Clear selected copy list if switching to a different student (per API contract 7.2)
      if (
        studentProfile &&
        studentProfile.student.accountId.toLowerCase() !==
          profile.student.accountId.toLowerCase()
      ) {
        setSelectedCopies([]);
      }
      setStudentProfile(profile);
      setStudentInput(profile.student.accountId);
    } catch (err) {
      setStudentProfile(null);
      setSelectedCopies([]);
      const msg =
        err instanceof ApiClientError
          ? err.message
          : 'Unable to find that student account.';
      setStudentError(msg);
      showToast(msg, 'error');
    } finally {
      setIsFindingStudent(false);
    }
  };

  const handleFindCopy = async (
    e?: React.FormEvent,
    overrideCopyCode?: string,
  ) => {
    if (e) e.preventDefault();
    if (!studentProfile) return;

    const rawCode = (overrideCopyCode ?? copyInput).trim();
    if (!rawCode) {
      setCopyError('Please enter a physical copy ID / barcode.');
      return;
    }

    const norm = normalizeCode(rawCode);
    if (selectedCopies.some((item) => normalizeCode(item.copy.copyCode) === norm)) {
      const msg = `Copy ${rawCode.toUpperCase()} is already in the selected checkout list.`;
      setCopyError(msg);
      showToast(msg, 'info');
      return;
    }

    setIsCheckingCopy(true);
    setCopyError(null);
    setBlockedCopyCheck(null);
    setIssueError(null);

    try {
      const checkResult = await checkCopyForCheckoutApi(
        rawCode,
        studentProfile.student.accountId,
      );

      if (!checkResult.canAdd) {
        setBlockedCopyCheck(checkResult);
        showToast(
          checkResult.blockingInfo?.message ||
            `${checkResult.copy.copyCode} cannot be added.`,
          'error',
        );
        return;
      }

      if (
        selectedCopies.length >= studentProfile.eligibility.remainingLoanSpace
      ) {
        const msg = `${studentProfile.student.fullName} has ${studentProfile.eligibility.remainingLoanSpace} remaining loan space (${studentProfile.eligibility.activeLoansCount} / ${studentProfile.eligibility.maxLoansLimit} active). Remove a copy before adding another.`;
        setCopyError(msg);
        showToast(msg, 'error');
        return;
      }

      setSelectedCopies((prev) => [
        ...prev,
        {
          ...checkResult,
          dueDate: checkResult.defaultDueDate,
        },
      ]);
      setCopyInput('');
      showToast(
        `Added ${checkResult.copy.copyCode} (${checkResult.book.title}).`,
        'success',
      );
    } catch (err) {
      const msg =
        err instanceof ApiClientError
          ? err.message
          : 'Unable to check that physical copy barcode.';
      setCopyError(msg);
      showToast(msg, 'error');
    } finally {
      setIsCheckingCopy(false);
    }
  };

  const handleUpdateDueDate = (copyCode: string, nextDueDate: string) => {
    setSelectedCopies((prev) =>
      prev.map((item) =>
        item.copy.copyCode === copyCode
          ? { ...item, dueDate: nextDueDate }
          : item,
      ),
    );
  };

  const handleRemoveCopy = (copyCode: string) => {
    setSelectedCopies((prev) =>
      prev.filter((item) => item.copy.copyCode !== copyCode),
    );
  };

  const handleConfirmIssue = async () => {
    if (!studentProfile || selectedCopies.length === 0) return;
    setIsIssuing(true);
    setIssueError(null);

    try {
      const res = await issueBooksApi({
        studentAccountId: studentProfile.student.accountId,
        items: selectedCopies.map((item) => ({
          copyCode: item.copy.copyCode,
          dueDate: item.dueDate,
        })),
      });
      setConfirmModalOpen(false);
      setReceipt(res.data);
      showToast(
        res.message ||
          `${res.data.borrowEntries.length} ${
            res.data.borrowEntries.length === 1 ? 'book' : 'books'
          } issued to ${studentProfile.student.fullName}.`,
        'success',
      );
    } catch (err) {
      const msg =
        err instanceof ApiClientError
          ? err.message
          : 'Unable to complete this checkout transaction.';
      setIssueError(msg);
      showToast(msg, 'error');
    } finally {
      setIsIssuing(false);
    }
  };

  const handleResetForNextStudent = () => {
    setReceipt(null);
    setStudentInput('');
    setStudentProfile(null);
    setStudentError(null);
    setCopyInput('');
    setCopyError(null);
    setBlockedCopyCheck(null);
    setSelectedCopies([]);
    setConfirmModalOpen(false);
    setIssueError(null);
  };

  // ============================================================================
  // VIEW 2: BOOKS ISSUED RECEIPT (Figma 53:583)
  // ============================================================================
  if (receipt) {
    const count = receipt.borrowEntries.length;
    const summary = receipt.borrowerSummary;
    const initials =
      summary.initials ||
      summary.fullName
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
      <div className="pt-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[13px] text-brand-slate">
          <span>Borrowing &amp; returns / Issue books / Complete</span>
          <span>{formatBorrowingToday()}</span>
        </div>

        <div className="mt-2 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-[32px] leading-[40px] font-semibold text-brand-ink">
              {count} {count === 1 ? 'book' : 'books'} issued
            </h1>
            <p className="mt-1.5 text-[14px] text-brand-slate">
              The transaction is complete. Hand{' '}
              {count === 1 ? 'this copy' : `all ${count} copies`} to{' '}
              {summary.fullName}.
            </p>
          </div>

          <Link
            to="/staff"
            className="h-10 px-4 rounded-md border border-brand-border bg-white inline-flex items-center gap-2 text-[13px] font-semibold text-brand-teal hover:border-brand-teal shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to home</span>
          </Link>
        </div>

        <div className="mt-5 rounded-xl border border-brand-teal/30 bg-brand-mint/60 px-5 py-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-brand-teal shrink-0 mt-0.5" />
          <div>
            <p className="text-[14px] font-semibold text-brand-teal">
              Checkout confirmed for {summary.fullName} · {summary.accountId}
            </p>
            <p className="mt-0.5 text-[13px] text-brand-ink/80">
              {count} separate borrow {count === 1 ? 'entry' : 'entries'}{' '}
              created on{' '}
              {formatShortBorrowingDate(
                receipt.borrowEntries[0]?.borrowedAt || receipt.issuedAt,
              )}
              . {count === 1 ? 'This physical copy is' : 'All issued copies are'}{' '}
              now Borrowed.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
          {/* Left: Borrow Entries Table & Fulfilled Holds */}
          <div className="space-y-4">
            <section className="rounded-xl border border-brand-border bg-white p-6">
              <h2 className="font-serif text-[20px] font-semibold text-brand-ink">
                Borrow entries
              </h2>
              <p className="mt-0.5 text-[13px] text-brand-slate">
                Each identifier belongs to one physical copy, not to the combined transaction.
              </p>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-brand-border text-[11px] font-semibold tracking-wider text-brand-slate uppercase">
                      <th className="py-3 pr-4">Borrow Entry</th>
                      <th className="py-3 px-4">Book / Copy</th>
                      <th className="py-3 px-4">Borrowed</th>
                      <th className="py-3 pl-4">Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border text-[13px]">
                    {receipt.borrowEntries.map((entry) => (
                      <tr key={entry._id}>
                        <td className="py-3.5 pr-4 font-mono font-semibold text-brand-teal">
                          {entry.borrowCode}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <BookCoverGraphic
                              title={entry.book.title}
                              author={entry.book.author}
                              coverKey={entry.book._id}
                              size="xs"
                            />
                            <div>
                              <p className="font-semibold text-[14px] text-brand-ink">
                                {entry.book.title}
                              </p>
                              <p className="text-[12px] text-brand-slate">
                                {entry.book.author} ·{' '}
                                <span className="font-mono font-medium text-brand-ink">
                                  {entry.copyCode}
                                </span>
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-brand-slate">
                          {formatShortBorrowingDate(entry.borrowedAt)}
                        </td>
                        <td className="py-3.5 pl-4 font-semibold text-brand-ink">
                          {formatShortBorrowingDate(entry.dueDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {receipt.fulfilledHolds.length > 0 && (
                <div className="mt-5 space-y-2.5">
                  {receipt.fulfilledHolds.map((hold) => (
                    <div
                      key={hold.holdCode}
                      className="rounded-lg border border-brand-teal/25 bg-brand-mint/40 px-4 py-3 flex items-start gap-2.5"
                    >
                      <BookmarkCheck className="w-4 h-4 text-brand-teal shrink-0 mt-0.5" />
                      <div className="text-[12.5px]">
                        <p className="font-semibold text-brand-teal">
                          Hold {hold.holdCode} fulfilled
                        </p>
                        <p className="text-brand-slate mt-0.5">
                          {hold.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="mt-5 pt-4 border-t border-brand-border text-[12px] text-brand-slate">
                Borrow entries retain the student ID, copy ID, borrow date and due date. They remain in history when the books are returned.
              </p>
            </section>
          </div>

          {/* Right: Borrower Summary Card */}
          <aside className="rounded-xl border border-brand-border bg-white p-6 space-y-5">
            <h2 className="font-serif text-[20px] font-semibold text-brand-ink">
              Borrower summary
            </h2>

            <div className="flex items-center gap-3.5 p-3.5 rounded-lg bg-brand-canvas border border-brand-border">
              <span className="w-10 h-10 rounded-full bg-brand-mint text-brand-teal font-bold text-[13px] flex items-center justify-center shrink-0">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-[15px] text-brand-ink truncate">
                  {summary.fullName}
                </p>
                <p className="text-[12px] text-brand-slate">
                  Student ID: {summary.accountId}
                  {summary.yearGroup ? ` · ${summary.yearGroup}` : ''}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-brand-border p-4 grid grid-cols-[1fr_auto_1fr] items-center text-center gap-2">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-brand-slate font-semibold">
                  Before
                </p>
                <p className="mt-1 font-serif text-[22px] font-semibold text-brand-ink">
                  {summary.loansBefore} / {summary.maxLoansLimit}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-brand-teal" />
              <div>
                <p className="text-[11px] uppercase tracking-wider text-brand-teal font-semibold">
                  Now
                </p>
                <p className="mt-1 font-serif text-[22px] font-semibold text-brand-teal">
                  {summary.loansNow} / {summary.maxLoansLimit}
                </p>
              </div>
            </div>

            <div className="space-y-1 text-[13px]">
              <p className="font-semibold text-brand-ink">
                {summary.remainingLoanSpace} remaining loan{' '}
                {summary.remainingLoanSpace === 1 ? 'space' : 'spaces'}
              </p>
              <p className="text-brand-slate">
                No overdue books or unpaid fines
              </p>
            </div>

            <button
              type="button"
              onClick={handleResetForNextStudent}
              className="w-full h-11 rounded-md bg-brand-teal hover:bg-brand-tealHover text-white font-semibold text-[13px] transition-colors"
            >
              Issue to another student
            </button>
          </aside>
        </div>
      </div>
    );
  }

  // ============================================================================
  // VIEW 1: LOAN A BOOK WORKSPACE (Figma 53:726) + CONFIRM MODAL (Figma 81:168)
  // ============================================================================
  const elig = studentProfile?.eligibility;
  const student = studentProfile?.student;
  const afterIssueCount = (elig?.activeLoansCount ?? 0) + selectedCopies.length;
  const maxLimit = elig?.maxLoansLimit ?? 5;
  const spaceAfterIssue = Math.max(0, maxLimit - afterIssueCount);
  const canConfirmTransaction =
    Boolean(studentProfile) &&
    Boolean(elig?.isEligible) &&
    selectedCopies.length > 0 &&
    afterIssueCount <= maxLimit;

  const fulfilledHoldPreview = selectedCopies
    .filter((c) => c.associatedHold)
    .map((c) => c.associatedHold!.holdCode);

  return (
    <div className="pt-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[13px] text-brand-slate">
        <span>Borrowing &amp; returns / Issue books</span>
        <span>{formatBorrowingToday()}</span>
      </div>

      <div className="mt-2 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-[32px] leading-[40px] font-semibold text-brand-ink">
            Loan a Book
          </h1>
          <p className="mt-1.5 text-[14px] text-brand-slate">
            Find the student, add physical copies, then confirm all selected books together.
          </p>
        </div>

        <Link
          to="/staff"
          className="h-10 px-4 rounded-md border border-brand-border bg-white inline-flex items-center justify-center text-[13px] font-semibold text-brand-teal hover:border-brand-teal shrink-0"
        >
          Cancel
        </Link>
      </div>

      {issueError && (
        <div
          role="alert"
          className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800 flex items-center gap-2.5"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{issueError}</span>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* Left Column: Step 1 (Student) & Step 2 (Add Physical Copies) */}
        <div className="space-y-6">
          {/* Step 1: Student Lookup Card */}
          <section className="rounded-xl border border-brand-border bg-white p-6">
            <h2 className="font-serif text-[20px] font-semibold text-brand-ink">
              Student
            </h2>
            <p className="mt-0.5 text-[13px] text-brand-slate">
              Enter the student ID manually, as shown on their school card.
            </p>

            <form
              onSubmit={(e) => void handleFindStudent(e)}
              className="mt-4 flex flex-col sm:flex-row gap-3"
            >
              <div className="flex-1">
                <label
                  htmlFor="checkout-student-id"
                  className="sr-only"
                >
                  Student ID
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-brand-slate absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="checkout-student-id"
                    type="text"
                    value={studentInput}
                    onChange={(e) => setStudentInput(e.target.value)}
                    placeholder="Student ID (e.g. S10428)"
                    className="w-full h-10 rounded-md border border-brand-border pl-9 pr-3 text-[13px] focus:outline-none focus:border-brand-teal"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isFindingStudent}
                className="h-10 px-5 rounded-md bg-brand-teal hover:bg-brand-tealHover text-[13px] font-semibold text-white disabled:opacity-60 shrink-0"
              >
                {isFindingStudent ? 'Finding…' : 'Find student'}
              </button>
            </form>

            {isMockEnabled && (
              <div className="mt-3 rounded-lg border border-brand-border bg-brand-canvas/60 px-3.5 py-2.5 flex flex-wrap items-center gap-2 text-[12px]">
                <span className="inline-flex items-center gap-1.5 font-medium text-brand-ink mr-1">
                  <Sparkles className="w-3.5 h-3.5 text-brand-teal" />
                  <span>Demo students:</span>
                </span>
                <button
                  type="button"
                  disabled={isFindingStudent}
                  onClick={() => void handleFindStudent(undefined, 'S10428')}
                  className="px-2.5 py-1 rounded bg-brand-mint text-brand-teal font-semibold hover:bg-brand-teal hover:text-white transition-colors disabled:opacity-50"
                >
                  Maya Chen · S10428
                </button>
                <button
                  type="button"
                  disabled={isFindingStudent}
                  onClick={() => void handleFindStudent(undefined, 'S10216')}
                  className="px-2.5 py-1 rounded bg-white border border-brand-border text-brand-ink font-medium hover:border-brand-teal transition-colors disabled:opacity-50"
                >
                  Amira Khan · S10216
                </button>
                <button
                  type="button"
                  disabled={isFindingStudent}
                  onClick={() => void handleFindStudent(undefined, 'S10312')}
                  className="px-2.5 py-1 rounded bg-brand-amberSurface text-brand-amberText font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Oliver Brown · S10312 (Overdue)
                </button>
                <button
                  type="button"
                  disabled={isFindingStudent}
                  onClick={() => void handleFindStudent(undefined, 'S10999')}
                  className="px-2.5 py-1 rounded bg-gray-100 text-brand-slate font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Liam Patel · S10999 (Locked)
                </button>
              </div>
            )}

            {studentError && (
              <div
                role="alert"
                className="mt-4 rounded-md bg-red-50 border border-red-200 px-3.5 py-2.5 text-[13px] text-red-800"
              >
                {studentError}
              </div>
            )}

            {student && elig && (
              <div className="mt-5 rounded-xl border border-brand-border bg-brand-canvas/70 p-4 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-brand-mint text-brand-teal font-bold text-[13px] flex items-center justify-center shrink-0">
                      {student.initials}
                    </span>
                    <div>
                      <p className="font-semibold text-[15px] text-brand-ink">
                        {student.fullName}
                      </p>
                      <p className="text-[12.5px] text-brand-slate">
                        Student ID: <span className="font-mono font-medium text-brand-ink">{student.accountId}</span>
                        {student.yearGroup ? ` · ${student.yearGroup}` : ''}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold ${
                      elig.isEligible
                        ? 'bg-[#E8F5EF] text-[#17645F]'
                        : 'bg-red-50 text-[#A1372B]'
                    }`}
                  >
                    Loaning {elig.activeLoansCount} out of {elig.maxLoansLimit}
                  </span>
                </div>

                <div
                  className={`rounded-lg px-3.5 py-2.5 text-[12.5px] font-medium ${
                    elig.isEligible
                      ? 'bg-white border border-brand-border text-brand-ink'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}
                >
                  {elig.statusBanner}
                </div>

                {studentProfile.activeHolds.length > 0 && (
                  <div className="rounded-lg border border-brand-teal/25 bg-brand-mint/40 px-3.5 py-2.5 space-y-1.5">
                    <p className="text-[12px] font-semibold text-brand-teal">
                      Ready holds waiting for {student.fullName.split(' ')[0]}:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {studentProfile.activeHolds.map((h) => {
                        const alreadySelected = selectedCopies.some(
                          (c) =>
                            normalizeCode(c.copy.copyCode) ===
                            normalizeCode(h.copyCode),
                        );
                        return (
                          <button
                            key={h.holdCode}
                            type="button"
                            disabled={alreadySelected || isCheckingCopy}
                            onClick={() => void handleFindCopy(undefined, h.copyCode)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-brand-teal/30 bg-white text-[12px] font-medium text-brand-teal hover:border-brand-teal disabled:opacity-50"
                          >
                            <span className="font-mono font-semibold">
                              {h.copyCode}
                            </span>
                            <span>· {h.bookTitle}</span>
                            <span className="text-brand-slate">
                              ({h.holdCode})
                            </span>
                            {!alreadySelected && (
                              <span className="underline ml-1">+ Add</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Step 2: Add Physical Copies Card */}
          <section className="rounded-xl border border-brand-border bg-white p-6">
            <h2 className="font-serif text-[20px] font-semibold text-brand-ink">
              Add physical copies
            </h2>
            <p className="mt-0.5 text-[13px] text-brand-slate">
              Use the unique copy ID / barcode, not the book&rsquo;s ISBN.
            </p>

            <form
              onSubmit={(e) => void handleFindCopy(e)}
              className="mt-4 flex flex-col sm:flex-row gap-3"
            >
              <div className="flex-1">
                <label
                  htmlFor="checkout-copy-code"
                  className="sr-only"
                >
                  Copy ID / barcode
                </label>
                <input
                  id="checkout-copy-code"
                  type="text"
                  disabled={!studentProfile || !elig?.isEligible}
                  value={copyInput}
                  onChange={(e) => setCopyInput(e.target.value)}
                  placeholder={
                    !studentProfile
                      ? 'Find a student first to enable copy lookup'
                      : 'Copy ID / barcode (e.g. WB-00421 or WB-00511)'
                  }
                  className="w-full h-10 rounded-md border border-brand-border px-3 text-[13px] font-mono focus:outline-none focus:border-brand-teal disabled:bg-brand-canvas disabled:text-brand-slate"
                />
              </div>
              <button
                type="submit"
                disabled={
                  !studentProfile || !elig?.isEligible || isCheckingCopy
                }
                className="h-10 px-5 rounded-md bg-brand-teal hover:bg-brand-tealHover text-[13px] font-semibold text-white disabled:opacity-60 shrink-0"
              >
                {isCheckingCopy ? 'Checking…' : 'Find copy'}
              </button>
            </form>

            {isMockEnabled && studentProfile && elig?.isEligible && (
              <div className="mt-3 rounded-lg border border-brand-border bg-brand-canvas/60 px-3.5 py-2.5 flex flex-wrap items-center gap-2 text-[12px]">
                <span className="inline-flex items-center gap-1.5 font-medium text-brand-ink mr-1">
                  <Sparkles className="w-3.5 h-3.5 text-brand-teal" />
                  <span>Demo copies:</span>
                </span>
                <button
                  type="button"
                  disabled={isCheckingCopy}
                  onClick={() => void handleFindCopy(undefined, 'WB-00421')}
                  className="px-2.5 py-1 rounded bg-brand-mint text-brand-teal font-semibold hover:bg-brand-teal hover:text-white transition-colors disabled:opacity-50"
                >
                  WB-00421 (Available)
                </button>
                <button
                  type="button"
                  disabled={isCheckingCopy}
                  onClick={() => void handleFindCopy(undefined, 'WB-00511')}
                  className="px-2.5 py-1 rounded bg-brand-mint text-brand-teal font-semibold hover:bg-brand-teal hover:text-white transition-colors disabled:opacity-50"
                >
                  WB-00511 (Available)
                </button>
                <button
                  type="button"
                  disabled={isCheckingCopy}
                  onClick={() => void handleFindCopy(undefined, 'WB-00423')}
                  className="px-2.5 py-1 rounded bg-brand-amberSurface text-brand-amberText font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  WB-00423 (Already borrowed)
                </button>
              </div>
            )}

            {copyError && (
              <div
                role="alert"
                className="mt-4 rounded-md bg-red-50 border border-red-200 px-3.5 py-2.5 text-[13px] text-red-800"
              >
                {copyError}
              </div>
            )}

            {/* Blocked Copy Alert Card (Figma 53:726 WB-00423 example) */}
            {blockedCopyCheck && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-[#E5B869] bg-[#FFF8EB] p-4 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <BookCoverGraphic
                      title={blockedCopyCheck.book.title}
                      author={blockedCopyCheck.book.author}
                      coverKey={blockedCopyCheck.book._id}
                      size="xs"
                    />
                    <div>
                      <p className="font-semibold text-[14px] text-brand-ink">
                        {blockedCopyCheck.book.title}
                      </p>
                      <p className="text-[12px] text-brand-slate">
                        Copy ID:{' '}
                        <span className="font-mono font-semibold text-brand-ink">
                          {blockedCopyCheck.copy.copyCode}
                        </span>{' '}
                        · Author: {blockedCopyCheck.book.author}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-red-100 text-[#A1372B] text-[12px] font-semibold">
                    {blockedCopyCheck.availabilityBadge}
                  </span>
                </div>

                <p className="text-[13px] font-semibold text-[#944200]">
                  {blockedCopyCheck.copy.copyCode} is not available — not added
                </p>
                <p className="text-[12.5px] text-[#944200]">
                  {blockedCopyCheck.blockingInfo?.message}
                </p>
              </div>
            )}

            {/* Selected Copies Table */}
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-brand-border text-[11px] font-semibold tracking-wider text-brand-slate uppercase">
                    <th className="py-3 pr-4">Book / Physical Copy</th>
                    <th className="py-3 px-4">Availability Check</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 pl-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border text-[13px]">
                  {selectedCopies.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-10 text-center text-brand-slate"
                      >
                        No physical copies added yet. Enter a copy barcode above to check availability and add it to this transaction.
                      </td>
                    </tr>
                  ) : (
                    selectedCopies.map((item) => (
                      <tr key={item.copy.copyCode}>
                        <td className="py-3.5 pr-4">
                          <div className="flex items-center gap-3">
                            <BookCoverGraphic
                              title={item.book.title}
                              author={item.book.author}
                              coverKey={item.book._id}
                              size="xs"
                            />
                            <div>
                              <p className="font-semibold text-[14px] text-brand-ink">
                                {item.book.title}
                              </p>
                              <p className="text-[12px] text-brand-slate">
                                {item.book.author} ·{' '}
                                <span className="font-mono font-semibold text-brand-ink">
                                  {item.copy.copyCode}
                                </span>
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${
                              item.associatedHold
                                ? 'bg-[#EDF2FF] text-[#315FF4]'
                                : 'bg-[#E8F5EF] text-[#17645F]'
                            }`}
                          >
                            {item.availabilityBadge}
                          </span>
                          {item.associatedHold && (
                            <span className="block text-[11.5px] text-brand-slate mt-1">
                              {item.associatedHold.holdCode} · Collect by{' '}
                              {formatShortBorrowingDate(
                                item.associatedHold.collectBy,
                              )}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <input
                            type="date"
                            aria-label={`Due date for ${item.copy.copyCode}`}
                            value={item.dueDate}
                            onChange={(e) =>
                              handleUpdateDueDate(
                                item.copy.copyCode,
                                e.target.value,
                              )
                            }
                            className="h-9 rounded-md border border-brand-border px-2.5 text-[12.5px] text-brand-ink focus:outline-none focus:border-brand-teal"
                          />
                        </td>
                        <td className="py-3.5 pl-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveCopy(item.copy.copyCode)}
                            className="h-8 px-3 rounded-md border border-brand-border text-[12px] font-semibold text-[#A1372B] hover:bg-red-50 inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <p className="mt-4 pt-3 border-t border-brand-border text-[12px] text-brand-slate">
              Available copies and copies reserved for this student can be added. Copies held for another student, damaged or lost cannot be issued.
            </p>
          </section>
        </div>

        {/* Right Column: Confirm Transaction Sidebar (Figma 53:726) */}
        <aside className="space-y-4">
          <section className="rounded-xl border border-brand-border bg-white p-6 space-y-4">
            <div>
              <h2 className="font-serif text-[20px] font-semibold text-brand-ink">
                Confirm this transaction
              </h2>
              <p className="mt-0.5 text-[13px] text-brand-slate">
                {student
                  ? `${student.fullName} · ${student.accountId}`
                  : 'Select a student and add copies to continue'}
              </p>
            </div>

            <dl className="divide-y divide-brand-border text-[13px]">
              <div className="py-2.5 flex items-center justify-between">
                <dt className="text-brand-slate">Borrow date</dt>
                <dd className="font-semibold text-brand-ink">
                  {formatBorrowingToday()}
                </dd>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <dt className="text-brand-slate">Existing loans</dt>
                <dd className="font-semibold text-brand-ink">
                  {elig ? `${elig.activeLoansCount} / ${elig.maxLoansLimit}` : '—'}
                </dd>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <dt className="text-brand-slate">Selected copies</dt>
                <dd className="font-semibold text-brand-ink">
                  {selectedCopies.length}
                </dd>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <dt className="text-brand-slate">After issue</dt>
                <dd className="font-semibold text-brand-teal">
                  {elig
                    ? `${afterIssueCount} / ${maxLimit} · ${spaceAfterIssue} space remaining`
                    : '—'}
                </dd>
              </div>
            </dl>

            {canConfirmTransaction && (
              <div className="rounded-lg border border-brand-teal/25 bg-brand-mint/40 p-3.5 text-[12.5px]">
                <p className="font-semibold text-brand-teal">
                  {selectedCopies.length === 1
                    ? 'Selected copy is valid'
                    : `All ${selectedCopies.length} selected copies are valid`}
                </p>
                <p className="mt-0.5 text-brand-slate">
                  Borrower eligibility, copy states, hold ownership and the {maxLimit}-loan limit have been checked together.
                </p>
              </div>
            )}

            <button
              type="button"
              disabled={!canConfirmTransaction || isIssuing}
              onClick={() => setConfirmModalOpen(true)}
              className="w-full h-11 rounded-md bg-brand-teal hover:bg-brand-tealHover text-white font-semibold text-[13px] disabled:opacity-50 transition-colors"
            >
              {selectedCopies.length > 0
                ? `Confirm issue of ${selectedCopies.length} ${
                    selectedCopies.length === 1 ? 'book' : 'books'
                  }`
                : 'Confirm issue'}
            </button>

            {selectedCopies.length > 0 && student && (
              <p className="text-[12px] text-brand-slate">
                Creates {selectedCopies.length} separate borrow{' '}
                {selectedCopies.length === 1 ? 'entry' : 'entries'}, one per
                copy.
                {fulfilledHoldPreview.length > 0
                  ? ` ${student.fullName.split(' ')[0]}’s hold ${fulfilledHoldPreview.join(
                      ', ',
                    )} will be fulfilled.`
                  : ''}
              </p>
            )}
          </section>

          <section className="rounded-xl border border-brand-border bg-white p-5 space-y-2 text-[12.5px] text-brand-slate">
            <div className="flex items-center gap-2 font-semibold text-brand-ink">
              <Info className="w-4 h-4 text-brand-teal" />
              <span>Before confirming</span>
            </div>
            <p className="leading-relaxed">
              Any overdue book or unpaid fine blocks this transaction. If eligibility or a copy changes, resolve the issue before confirming any of the selected books.
            </p>
            <p className="leading-relaxed">
              Students may renew online once for 7 days, only if no reservation exists.
            </p>
          </section>
        </aside>
      </div>

      {/* Confirm Order Details Modal (Figma 81:168) */}
      {confirmModalOpen && student && elig && (
        <div
          className="fixed inset-0 z-50 bg-brand-ink/35 px-4 flex items-center justify-center"
          role="presentation"
          onMouseDown={(e) => {
            if (e.currentTarget === e.target && !isIssuing) {
              setConfirmModalOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-issue-modal-title"
            className="w-full max-w-[720px] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[12px] border border-brand-border bg-white p-7 shadow-xl"
          >
            <h2
              id="confirm-issue-modal-title"
              className="font-serif text-[25px] leading-[34px] font-medium text-brand-ink"
            >
              Confirm order details
            </h2>
            <p className="mt-1 text-[13px] text-brand-slate">
              Default due date:{' '}
              {formatShortBorrowingDate(selectedCopies[0]?.dueDate || '')} · 14 days from today
            </p>

            <div className="mt-4 rounded-xl border border-brand-border bg-brand-canvas p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-brand-mint text-brand-teal font-bold text-[12px] flex items-center justify-center">
                  {student.initials}
                </span>
                <div>
                  <p className="font-semibold text-[14px] text-brand-ink">
                    {student.fullName}
                  </p>
                  <p className="text-[12px] text-brand-slate">
                    Student ID: {student.accountId}
                    {student.yearGroup ? ` · ${student.yearGroup}` : ''}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#E8F5EF] text-[#17645F] text-[12px] font-semibold">
                Loaning {elig.activeLoansCount} out of {elig.maxLoansLimit}
              </span>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-brand-border text-[11px] font-semibold tracking-wider text-brand-slate uppercase">
                    <th className="py-2.5 pr-3">Book / Physical Copy</th>
                    <th className="py-2.5 px-3">Availability Check</th>
                    <th className="py-2.5 pl-3">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border text-[13px]">
                  {selectedCopies.map((item) => (
                    <tr key={item.copy.copyCode}>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-3">
                          <BookCoverGraphic
                            title={item.book.title}
                            author={item.book.author}
                            coverKey={item.book._id}
                            size="xs"
                          />
                          <div>
                            <p className="font-semibold text-brand-ink">
                              {item.book.title}
                            </p>
                            <p className="text-[12px] text-brand-slate">
                              {item.book.author} ·{' '}
                              <span className="font-mono font-semibold text-brand-ink">
                                {item.copy.copyCode}
                              </span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-brand-teal">
                          {item.availabilityBadge}
                        </span>
                        {item.associatedHold && (
                          <span className="block text-[11.5px] text-brand-slate">
                            {item.associatedHold.holdCode} · Collect by{' '}
                            {formatShortBorrowingDate(
                              item.associatedHold.collectBy,
                            )}
                          </span>
                        )}
                      </td>
                      <td className="py-3 pl-3 font-semibold text-brand-ink">
                        {formatShortBorrowingDate(item.dueDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-[12px] text-brand-slate">
              You can add {spaceAfterIssue} more{' '}
              {spaceAfterIssue === 1 ? 'copy' : 'copies'} to this transaction. Duplicate copy IDs are not added.
            </p>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                disabled={isIssuing}
                onClick={() => setConfirmModalOpen(false)}
                className="h-10 px-5 rounded-md border border-brand-border text-[13px] font-semibold text-brand-teal hover:border-brand-teal disabled:opacity-60"
              >
                Back
              </button>
              <button
                type="button"
                disabled={isIssuing || selectedCopies.length === 0}
                onClick={() => void handleConfirmIssue()}
                className="h-10 px-5 rounded-md bg-brand-teal hover:bg-brand-tealHover text-[13px] font-semibold text-white disabled:opacity-60"
              >
                {isIssuing
                  ? 'Issuing…'
                  : `Issue ${selectedCopies.length} ${
                      selectedCopies.length === 1 ? 'book' : 'books'
                    }`}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
