import React, { useState } from 'react';
import { createBookApi } from '../../api/endpoints';
import { ApiClientError } from '../../api/client';
import { Book, BookCategory } from '../../types/api';
import { BookCoverGraphic } from '../BookCoverGraphic';

interface AddBookModalProps {
  onCancel: () => void;
  onCreated: (book: Book) => void;
}

const CATEGORIES: BookCategory[] = [
  'Fiction',
  'Non-fiction',
  'Poetry',
  'Graphic novels',
  'Reference',
];

export const AddBookModal: React.FC<AddBookModalProps> = ({
  onCancel,
  onCreated,
}) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [category, setCategory] = useState<BookCategory>('Fiction');
  const [keywordsInput, setKeywordsInput] = useState('');
  const [publisher, setPublisher] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !author.trim() || !isbn.trim()) {
      setError('Title, author, and ISBN are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const keywords = keywordsInput
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);
      const created = await createBookApi({
        title: title.trim(),
        author: author.trim(),
        isbn: isbn.trim(),
        category,
        keywords,
        publisher: publisher.trim() || null,
      });
      onCreated(created);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'Unable to save this book title.',
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
        aria-labelledby="add-book-modal-title"
        className="w-full max-w-[560px] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[12px] border border-brand-border bg-white p-7 shadow-xl"
      >
        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded bg-brand-beige text-[11px] font-semibold text-brand-slate">
                New title · Not saved
              </span>
              <h2
                id="add-book-modal-title"
                className="mt-2 font-serif text-[25px] leading-[34px] font-medium text-brand-ink"
              >
                Add a book
              </h2>
              <p className="mt-1 text-[13px] text-brand-slate">
                Book metadata is shared by all physical copies.
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-brand-border bg-brand-canvas p-3.5 flex items-center gap-3.5">
            <BookCoverGraphic
              title={title.trim() || 'New book title'}
              author={author.trim() || 'Author'}
              size="xs"
            />
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-brand-ink truncate">
                {title.trim() || 'New book title'}
              </p>
              <p className="text-[12px] text-brand-slate truncate">
                {author.trim() || 'Author name'} · {category}
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
                Title <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. The Wild Robot"
                className="mt-1.5 w-full h-10 rounded-md border border-brand-border px-3 text-[13px] focus:outline-none focus:border-brand-teal"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[13px] font-semibold text-brand-ink">
                  Author <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="e.g. Peter Brown"
                  className="mt-1.5 w-full h-10 rounded-md border border-brand-border px-3 text-[13px] focus:outline-none focus:border-brand-teal"
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
                placeholder="e.g. 9781848127272"
                className="mt-1.5 w-full h-10 rounded-md border border-brand-border px-3 text-[13px] focus:outline-none focus:border-brand-teal"
              />
              <p className="mt-1 text-[11px] text-brand-slate">
                ISBN identifies this edition, not an individual copy.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[13px] font-semibold text-brand-ink">
                  Keywords
                </label>
                <input
                  type="text"
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                  placeholder="Robots, nature, friendship"
                  className="mt-1.5 w-full h-10 rounded-md border border-brand-border px-3 text-[13px] focus:outline-none focus:border-brand-teal"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-brand-ink">
                  Publisher <span className="font-normal text-brand-slate">(optional)</span>
                </label>
                <input
                  type="text"
                  value={publisher}
                  onChange={(e) => setPublisher(e.target.value)}
                  placeholder="e.g. Piccadilly Press"
                  className="mt-1.5 w-full h-10 rounded-md border border-brand-border px-3 text-[13px] focus:outline-none focus:border-brand-teal"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-brand-border bg-brand-mint/40 px-3.5 py-3">
            <p className="text-[12px] font-semibold text-brand-teal">
              Copies are added after the title is saved
            </p>
            <p className="mt-0.5 text-[12px] text-brand-slate">
              A new title starts with 0 copies. Add each physical copy with its own unique ID / barcode.
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
              {isSubmitting ? 'Saving…' : 'Save title & add copies'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
