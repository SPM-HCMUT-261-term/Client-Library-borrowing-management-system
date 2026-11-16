import React, { useState } from 'react';
import { deleteCopyApi, updateCopyApi } from '../../api/endpoints';
import { ApiClientError } from '../../api/client';
import { BookDetail, BookDetailCopy, CopyCondition } from '../../types/api';
import { BookCoverGraphic } from '../BookCoverGraphic';

interface EditCopyModalProps {
  book: BookDetail;
  copy: BookDetailCopy;
  onCancel: () => void;
  onUpdated: (message: string) => void;
}

const EDITABLE_STATES: Array<'Available' | 'Damaged' | 'Lost'> = [
  'Available',
  'Damaged',
  'Lost',
];
const CONDITIONS: CopyCondition[] = ['Good', 'Damaged', 'Lost'];

export const EditCopyModal: React.FC<EditCopyModalProps> = ({
  book,
  copy,
  onCancel,
  onUpdated,
}) => {
  const isCirculationLocked =
    copy.state === 'Borrowed' || copy.state === 'Reserved';
  const initialEditableState: 'Available' | 'Damaged' | 'Lost' =
    copy.state === 'Damaged' || copy.state === 'Lost'
      ? copy.state
      : 'Available';

  const [homeLocation, setHomeLocation] = useState(copy.homeLocation);
  const [state, setState] =
    useState<'Available' | 'Damaged' | 'Lost'>(initialEditableState);
  const [condition, setCondition] = useState<CopyCondition>(copy.condition);
  const [notes, setNotes] = useState(copy.notes || '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canDeleteCopy = !copy.hasLoanHistory && !isCirculationLocked;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!homeLocation.trim()) {
      setError('Home location is required.');
      return;
    }

    if (isCirculationLocked) {
      setError(
        "Complete the return or cancel the hold before changing a borrowed/reserved copy's state.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await updateCopyApi(copy._id, {
        homeLocation: homeLocation.trim(),
        state,
        condition,
        notes: notes.trim() || null,
      });
      onUpdated(`Copy ${copy.copyCode} updated.`);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'Unable to update this copy.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!canDeleteCopy) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await deleteCopyApi(copy._id);
      onUpdated(`Copy ${copy.copyCode} deleted.`);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'Unable to delete this copy.',
      );
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
        aria-labelledby="edit-copy-modal-title"
        className="w-full max-w-[560px] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[12px] border border-brand-border bg-white p-7 shadow-xl"
      >
        <form onSubmit={(e) => void handleSave(e)}>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded bg-brand-beige text-[11px] font-semibold text-brand-slate">
            Existing copy · ID / barcode remains {copy.copyCode}
          </span>
          <h2
            id="edit-copy-modal-title"
            className="mt-2 font-serif text-[25px] leading-[34px] font-medium text-brand-ink"
          >
            Edit copy · {copy.copyCode}
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
                Home location <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={homeLocation}
                onChange={(e) => setHomeLocation(e.target.value)}
                className="mt-1.5 w-full h-10 rounded-md border border-brand-border px-3 text-[13px] focus:outline-none focus:border-brand-teal"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[13px] font-semibold text-brand-ink">
                  State <span className="text-red-600">*</span>
                </label>
                {isCirculationLocked ? (
                  <input
                    type="text"
                    disabled
                    value={`${copy.state} (controlled by circulation)`}
                    className="mt-1.5 w-full h-10 rounded-md border border-brand-border bg-brand-canvas px-3 text-[13px] text-brand-slate"
                  />
                ) : (
                  <select
                    value={state}
                    onChange={(e) =>
                      setState(
                        e.target.value as 'Available' | 'Damaged' | 'Lost',
                      )
                    }
                    className="mt-1.5 w-full h-10 rounded-md border border-brand-border bg-white px-3 text-[13px] focus:outline-none focus:border-brand-teal"
                  >
                    {EDITABLE_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                )}
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
                  disabled={isCirculationLocked}
                  className="mt-1.5 w-full h-10 rounded-md border border-brand-border bg-white px-3 text-[13px] focus:outline-none focus:border-brand-teal disabled:bg-brand-canvas disabled:text-brand-slate"
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
                disabled={isCirculationLocked}
                placeholder="Condition or shelf notes"
                className="mt-1.5 w-full h-10 rounded-md border border-brand-border px-3 text-[13px] focus:outline-none focus:border-brand-teal disabled:bg-brand-canvas"
              />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-brand-border flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-brand-ink">
                Delete copy
              </p>
              <p className="text-[12px] text-brand-slate">
                {canDeleteCopy
                  ? 'Permanently remove this physical copy record.'
                  : 'Deletion disabled: this copy has loan history. Use Damaged or Lost to make a copy unavailable; keep its records.'}
              </p>
            </div>
            <button
              type="button"
              disabled={!canDeleteCopy || isSubmitting}
              onClick={() => void handleDelete()}
              className="shrink-0 h-9 px-3.5 rounded-md border border-[#A1372B] text-[12px] font-semibold text-[#A1372B] hover:bg-red-50 disabled:border-brand-border disabled:text-brand-slate/60 disabled:hover:bg-transparent"
            >
              Delete copy
            </button>
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
              disabled={isSubmitting || isCirculationLocked}
              className="h-10 px-5 rounded-md bg-brand-teal hover:bg-brand-tealHover text-[13px] font-semibold text-white disabled:opacity-60"
            >
              {isSubmitting ? 'Saving…' : 'Save copy changes'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
