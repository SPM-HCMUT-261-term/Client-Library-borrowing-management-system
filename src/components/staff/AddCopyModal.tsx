import React, { useState } from 'react';
import { addCopyToBookApi } from '../../api/endpoints';
import { ApiClientError } from '../../api/client';
import { BookDetail, CopyCondition } from '../../types/api';
import { BookCoverGraphic } from '../BookCoverGraphic';

interface AddCopyModalProps {
  book: BookDetail;
  onCancel: () => void;
  onAdded: (copyCode: string) => void;
}

const INITIAL_STATES: Array<'Available' | 'Damaged' | 'Lost'> = [
  'Available',
  'Damaged',
  'Lost',
];
const CONDITIONS: CopyCondition[] = ['Good', 'Damaged', 'Lost'];

export const AddCopyModal: React.FC<AddCopyModalProps> = ({
  book,
  onCancel,
  onAdded,
}) => {
  const [copyCode, setCopyCode] = useState('');
  const [homeLocation, setHomeLocation] = useState(
    book.shelfReference || book.copies[0]?.homeLocation || '',
  );
  const [initialState, setInitialState] =
    useState<'Available' | 'Damaged' | 'Lost'>('Available');
  const [condition, setCondition] = useState<CopyCondition>('Good');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentTotal = book.stockSummary.totalCopies;
  const currentAvailable = book.stockSummary.availableCopies;
  const previewTotal = currentTotal + 1;
  const previewAvailable =
    currentAvailable + (initialState === 'Available' ? 1 : 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!copyCode.trim() || !homeLocation.trim()) {
      setError('Unique copy ID / barcode and home location are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await addCopyToBookApi(book._id, {
        copyCode: copyCode.trim(),
        homeLocation: homeLocation.trim(),
        initialState,
        condition,
        notes: notes.trim() || null,
      });
      onAdded(result.copy.copyCode);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'Unable to add this physical copy.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-brand-ink/35 px-4 flex items-center justify-center"
      role="presentation"
      onMouseDown={(e) => {
        if (e.currentTarget === e.target && !isSubmitting) onCancel();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-copy-modal-title"
        className="w-full max-w-[560px] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[12px] border border-brand-border bg-white p-7 shadow-xl"
      >
        <form onSubmit={(e) => void handleSubmit(e)}>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded bg-brand-beige text-[11px] font-semibold text-brand-slate">
            {book.title} · New copy, not saved
          </span>
          <h2
            id="add-copy-modal-title"
            className="mt-2 font-serif text-[25px] leading-[34px] font-medium text-brand-ink"
          >
            Add a physical copy
          </h2>

          <div className="mt-3.5 rounded-lg border border-brand-border bg-brand-canvas p-3 flex items-center gap-3">
            <BookCoverGraphic title={book.title} author={book.author} size="xs" />
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-brand-ink truncate">
                {book.title}
              </p>
              <p className="text-[12px] text-brand-slate truncate">
                {book.author}
              </p>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-md bg-red-50 border border-red-200 px-3.5 py-2.5 text-[13px] text-red-800"
            >
              {error}
            </div>
          )}

          <div className="mt-4 space-y-3.5">
            <div>
              <label className="block text-[13px] font-semibold text-brand-ink">
                Unique copy ID / barcode <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={copyCode}
                onChange={(e) => setCopyCode(e.target.value)}
                placeholder="e.g. WB-00425"
                className="mt-1.5 w-full h-10 rounded-md border border-brand-border px-3 text-[13px] focus:outline-none focus:border-brand-teal"
              />
              <p className="mt-1 text-[11px] text-brand-slate">
                Must be unique across the library. Printed barcode uses this ID.
              </p>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-brand-ink">
                Home location <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={homeLocation}
                onChange={(e) => setHomeLocation(e.target.value)}
                placeholder="e.g. FIC HAI · A3"
                className="mt-1.5 w-full h-10 rounded-md border border-brand-border px-3 text-[13px] focus:outline-none focus:border-brand-teal"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[13px] font-semibold text-brand-ink">
                  Initial state <span className="text-red-600">*</span>
                </label>
                <select
                  value={initialState}
                  onChange={(e) =>
                    setInitialState(
                      e.target.value as 'Available' | 'Damaged' | 'Lost',
                    )
                  }
                  className="mt-1.5 w-full h-10 rounded-md border border-brand-border bg-white px-3 text-[13px] focus:outline-none focus:border-brand-teal"
                >
                  {INITIAL_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-brand-ink">
                  Condition <span className="text-red-600">*</span>
                </label>
                <select
                  value={condition}
                  onChange={(e) =>
                    setCondition(e.target.value as CopyCondition)
                  }
                  className="mt-1.5 w-full h-10 rounded-md border border-brand-border bg-white px-3 text-[13px] focus:outline-none focus:border-brand-teal"
                >
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-brand-ink">
                Notes <span className="font-normal text-brand-slate">(optional)</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. New paperback copy"
                className="mt-1.5 w-full h-10 rounded-md border border-brand-border px-3 text-[13px] focus:outline-none focus:border-brand-teal"
              />
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-brand-border bg-brand-mint/40 px-3.5 py-3">
            <p className="text-[12px] font-semibold text-brand-teal">
              Preview: {previewAvailable} available / {previewTotal} total
            </p>
            <p className="mt-0.5 text-[12px] text-brand-slate">
              After saving, this new copy increases total stock by 1. Current saved stock is still {currentAvailable} available / {currentTotal} total.
            </p>
          </div>

          <div className="mt-5 flex justify-end gap-2.5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onCancel}
              className="h-10 px-5 rounded-md border border-brand-border text-[13px] font-semibold text-brand-teal hover:border-brand-teal disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-5 rounded-md bg-brand-teal hover:bg-brand-tealHover text-[13px] font-semibold text-white disabled:opacity-60"
            >
              {isSubmitting ? 'Adding…' : 'Add copy'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
