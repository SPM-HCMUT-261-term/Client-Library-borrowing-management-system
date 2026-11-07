import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Check,
  Clock,
  Info,
  MapPin,
  IdCard,
  BookOpenCheck,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { HoldConfirmation } from '../types/api';
import {
  cancelHoldApi,
  getBookByIdApi,
  getMyBorrowingApi,
} from '../api/endpoints';
import { BookCoverGraphic } from '../components/BookCoverGraphic';
import { useAuth } from '../context/AuthContext';
import { ApiClientError } from '../api/client';

interface LocationState {
  confirmation?: HoldConfirmation;
}

export const HoldConfirmedPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const initialConfirmation =
    (location.state as LocationState | null)?.confirmation || null;

  const [confirmation, setConfirmation] = useState<HoldConfirmation | null>(
    initialConfirmation,
  );
  const [isLoading, setIsLoading] = useState<boolean>(!initialConfirmation);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'Maya';

  // If user reloads /holds/:id/confirmed directly, reconstruct from GET /me/borrowing + GET /books/:id
  useEffect(() => {
    if (confirmation || !id) return;

    let active = true;
    const loadFromBorrowing = async () => {
      setIsLoading(true);
      try {
        const dashboard = await getMyBorrowingApi();
        const found = dashboard.holdRequests.find(
          (h) =>
            h.holdCode.toLowerCase() === id.toLowerCase() || h._id === id,
        );

        if (!found) {
          if (active) {
            setErrorMessage('This hold request was not found or was cancelled.');
          }
          return;
        }

        const bookDetail = await getBookByIdApi(found.book._id);
        if (active) {
          setConfirmation({
            _id: found._id,
            holdCode: found.holdCode,
            status: found.status,
            requestedAt: found.requestedAt,
            collectBy: found.collectBy,
            book: {
              _id: bookDetail._id,
              title: bookDetail.title,
              author: bookDetail.author,
              format: bookDetail.format,
              shelfReference: bookDetail.shelfReference,
              coverImageUrl: bookDetail.coverImageUrl,
              stockSummary: {
                totalCopies: bookDetail.stockSummary.totalCopies,
                availableCopies: bookDetail.stockSummary.availableCopies,
                borrowedCopies: bookDetail.stockSummary.borrowedCopies,
                reservedCopies: bookDetail.stockSummary.reservedCopies,
              },
            },
            assignedCopy: {
              _id: found.copy._id,
              copyCode: found.copy.copyCode,
              homeLocation: found.copy.homeLocation,
            },
            studentLoanUsage: {
              activeLoansCount: dashboard.accountSummary.activeLoansCount,
              maxLoansLimit: dashboard.accountSummary.maxLoansLimit,
            },
          });
        }
      } catch {
        if (active) {
          setErrorMessage('Unable to load hold confirmation details.');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadFromBorrowing();
    return () => {
      active = false;
    };
  }, [confirmation, id]);

  const handleCancelHold = async () => {
    if (!confirmation) return;
    setIsCancelling(true);
    setErrorMessage(null);
    try {
      await cancelHoldApi(confirmation.holdCode);
      await refreshUser();
      navigate(`/books/${confirmation.book._id}`);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Could not cancel this hold right now.');
      }
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 max-w-[880px] mx-auto space-y-8 animate-pulse">
        <div className="h-24 bg-white rounded-2xl border border-brand-border" />
        <div className="h-80 bg-white rounded-2xl border border-brand-border" />
      </div>
    );
  }

  if (!confirmation) {
    return (
      <div className="py-14 max-w-lg mx-auto text-center space-y-4">
        <div className="rounded-2xl border border-brand-border bg-white p-10 space-y-4">
          <p className="font-serif text-[26px] text-brand-ink">
            Hold confirmation unavailable
          </p>
          <p className="text-[14px] text-brand-slate">
            {errorMessage || 'We could not find an active hold matching that ID.'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              to="/my-borrowing"
              className="px-4 py-2.5 rounded-[8px] bg-brand-teal text-white text-[13px] font-semibold hover:bg-brand-tealHover"
            >
              View my borrowing
            </Link>
            <Link
              to="/books"
              className="px-4 py-2.5 rounded-[8px] border border-brand-border text-brand-ink text-[13px] font-semibold hover:border-brand-teal"
            >
              Browse catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { book, assignedCopy, studentLoanUsage } = confirmation;
  const { totalCopies, availableCopies, borrowedCopies, reservedCopies } =
    book.stockSummary;

  return (
    <div className="py-10 md:py-12 max-w-[880px] mx-auto space-y-10">
      {/* Top Centered Success Banner matching Figma node 6:2583 */}
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-brand-mint text-brand-teal mx-auto flex items-center justify-center">
          <Check className="w-5 h-5 stroke-[2.25]" />
        </div>

        <p className="text-[11px] font-semibold tracking-[0.06em] uppercase text-brand-teal pt-1">
          HOLD REQUEST SUCCESSFUL
        </p>

        <h1 className="font-serif text-[34px] md:text-[42px] leading-tight text-brand-ink font-normal">
          Your next chapter is waiting.
        </h1>

        <p className="text-[15px] text-brand-slate">
          {firstName}, we&apos;ve set aside a copy of {book.title} for you.
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-[10px] bg-red-50 border border-red-200 p-4 flex items-center gap-2.5 text-[13px] text-red-800"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Hold Receipt Card */}
      <section className="rounded-[14px] border border-brand-border bg-white overflow-hidden shadow-[0_2px_10px_rgba(32,59,59,0.03)]">
        {/* Card Header Bar */}
        <div className="bg-brand-mint px-6 py-3.5 flex flex-wrap items-center justify-between gap-2 text-[12px]">
          <span className="inline-flex items-center gap-1.5 font-semibold text-brand-teal">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-teal" />
            <span>Ready for collection</span>
          </span>
          <span className="text-brand-teal font-medium">
            Hold {confirmation.holdCode} · Requested 15 Oct 2026
          </span>
        </div>

        {/* Card Body */}
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-[1fr_270px] gap-8 items-center">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <Link to={`/books/${book._id}`} className="shrink-0">
              <BookCoverGraphic
                title={book.title}
                author={book.author}
                size="md"
              />
            </Link>

            <div className="space-y-2">
              <Link
                to={`/books/${book._id}`}
                className="font-serif text-[25px] leading-snug text-brand-ink hover:text-brand-teal transition-colors block"
              >
                {book.title}
              </Link>
              <p className="text-[14px] text-brand-slate">{book.author}</p>
              <p className="text-[13px] font-semibold text-brand-ink pt-1">
                Copy {assignedCopy.copyCode} · {book.format}
              </p>
              <p className="text-[12.5px] text-brand-slate">
                Shelf reference: {assignedCopy.homeLocation}
              </p>
              <p className="text-[12.5px] text-brand-slate">
                {totalCopies} copies: {reservedCopies} held for you,{' '}
                {availableCopies} available, {borrowedCopies} on loan
              </p>
            </div>
          </div>

          {/* Warm Amber COLLECT BY Box */}
          <div className="rounded-[10px] bg-brand-amberSurface p-5 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.05em] uppercase text-brand-amberText">
              <Clock className="w-3.5 h-3.5" />
              <span>COLLECT BY</span>
            </div>
            <p className="font-serif text-[23px] leading-tight text-brand-ink">
              Fri, 16 October
            </p>
            <p className="text-[14px] font-semibold text-brand-ink">3:30 pm</p>
            <p className="text-[11.5px] leading-[1.5] text-brand-amberText pt-1">
              Illustrative pickup deadline for this demo. Uncollected holds are
              released.
            </p>
          </div>
        </div>

        {/* Card Footer Notice */}
        <div className="border-t border-brand-border px-6 py-3.5 flex items-center gap-2.5 text-[12.5px] text-brand-ink">
          <Info className="w-4 h-4 text-brand-teal shrink-0" />
          <span>
            This is a hold, not a loan. You still have{' '}
            {studentLoanUsage.activeLoansCount} of{' '}
            {studentLoanUsage.maxLoansLimit} books borrowed. Your 14-day loan
            starts when staff confirm collection.
          </span>
        </div>
      </section>

      {/* Here's what happens next (3-column steps) */}
      <section className="space-y-5">
        <h2 className="font-serif text-[24px] text-brand-ink font-normal">
          Here&apos;s what happens next
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2.5">
            <div className="w-9 h-9 rounded-[8px] bg-brand-mint text-brand-teal flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="text-[14px] font-semibold text-brand-ink">
              Visit the library counter
            </h3>
            <p className="text-[12.5px] leading-[1.6] text-brand-slate">
              Your copy is held at the main library counter, not on the open
              shelf.
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="w-9 h-9 rounded-[8px] bg-brand-mint text-brand-teal flex items-center justify-center">
              <IdCard className="w-4 h-4" />
            </div>
            <h3 className="text-[14px] font-semibold text-brand-ink">
              Bring your student ID
            </h3>
            <p className="text-[12.5px] leading-[1.6] text-brand-slate">
              Show your ID and hold reference {confirmation.holdCode} so staff
              can find your copy.
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="w-9 h-9 rounded-[8px] bg-brand-mint text-brand-teal flex items-center justify-center">
              <BookOpenCheck className="w-4 h-4" />
            </div>
            <h3 className="text-[14px] font-semibold text-brand-ink">
              Staff confirm your loan
            </h3>
            <p className="text-[12.5px] leading-[1.6] text-brand-slate">
              You&apos;ll receive a due date at collection. Return the book to
              staff when you&apos;re finished.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom Action Buttons & Cancel Link */}
      <div className="space-y-5 pt-2 text-center">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/my-borrowing"
            className="inline-flex items-center gap-2 h-[44px] px-5 rounded-[8px] bg-brand-teal hover:bg-brand-tealHover text-white font-semibold text-[14px] transition-colors"
          >
            <span>View my holds</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/books"
            className="inline-flex items-center justify-center h-[44px] px-5 rounded-[8px] bg-white border border-brand-border hover:border-brand-teal text-brand-teal font-semibold text-[14px] transition-colors"
          >
            Keep browsing
          </Link>
        </div>

        <p className="text-[12.5px] text-brand-slate">
          Can&apos;t make it?{' '}
          <button
            type="button"
            disabled={isCancelling}
            onClick={() => void handleCancelHold()}
            className="font-semibold text-brand-teal hover:underline disabled:opacity-50"
          >
            {isCancelling ? 'Cancelling hold...' : 'Cancel this hold'}
          </button>{' '}
          so someone else can read it.
        </p>
      </div>
    </div>
  );
};
