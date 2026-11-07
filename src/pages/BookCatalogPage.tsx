import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  X,
  ChevronUp,
  ChevronDown,
  ArrowUpRight,
  BookmarkCheck,
} from 'lucide-react';
import { getBooksApi } from '../api/endpoints';
import {
  BookCategory,
  BookLanguage,
  CatalogBookItem,
  PaginationInfo,
} from '../types/api';
import { BookCoverGraphic } from '../components/BookCoverGraphic';

const CATEGORIES: BookCategory[] = [
  'Fiction',
  'Non-fiction',
  'Poetry',
  'Graphic novels',
  'Reference',
];

const GENRES: string[] = [
  'Fantasy',
  'Historical fiction',
  'Science fiction',
  'Contemporary fiction',
];

const LANGUAGES: BookLanguage[] = ['English', 'Vietnamese'];

export const BookCatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Derive active query state from URL search params
  const qParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';
  const genreParam = searchParams.get('genre') || '';
  const languageParam = searchParams.get('language') || '';
  const availableNowParam = searchParams.get('availableNow') === 'true';
  const sortByParam =
    (searchParams.get('sortBy') as 'relevance' | 'title' | 'publishedYear') ||
    'relevance';
  const pageParam = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

  const selectedCategories = categoryParam
    ? categoryParam.split(',').filter(Boolean)
    : [];
  const selectedGenres = genreParam
    ? genreParam.split(',').filter(Boolean)
    : [];
  const selectedLanguages = languageParam
    ? languageParam.split(',').filter(Boolean)
    : [];

  const [searchInput, setSearchInput] = useState<string>(qParam);
  const [books, setBooks] = useState<CatalogBookItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    totalItems: 0,
    currentPage: 1,
    totalPages: 1,
    limit: 6,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Accordion collapse states
  const [openSections, setOpenSections] = useState({
    availability: true,
    category: true,
    genre: true,
    language: true,
  });

  useEffect(() => {
    setSearchInput(qParam);
  }, [qParam]);

  const fetchCatalog = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getBooksApi({
        q: qParam || undefined,
        category: categoryParam || undefined,
        genre: genreParam || undefined,
        language: languageParam || undefined,
        availableNow: availableNowParam ? true : undefined,
        sortBy: sortByParam,
        page: pageParam,
        limit: 6,
      });
      setBooks(result.items);
      setPagination(result.pagination);
    } catch (err) {
      console.error('Failed to load catalog books:', err);
    } finally {
      setIsLoading(false);
    }
  }, [
    qParam,
    categoryParam,
    genreParam,
    languageParam,
    availableNowParam,
    sortByParam,
    pageParam,
  ]);

  useEffect(() => {
    void fetchCatalog();
    const handleReset = () => void fetchCatalog();
    window.addEventListener('mock-db-reset', handleReset);
    return () => window.removeEventListener('mock-db-reset', handleReset);
  }, [fetchCatalog]);

  const updateParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (!val) {
        next.delete(key);
      } else {
        next.set(key, val);
      }
    });
    if (!('page' in updates)) {
      next.delete('page');
    }
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ q: searchInput.trim() || null });
  };

  const handleClearSearch = () => {
    setSearchInput('');
    updateParams({ q: null });
  };

  const toggleMultiFilter = (
    key: 'category' | 'genre' | 'language',
    currentList: string[],
    value: string,
  ) => {
    const exists = currentList.includes(value);
    const nextList = exists
      ? currentList.filter((item) => item !== value)
      : [...currentList, value];
    updateParams({ [key]: nextList.length > 0 ? nextList.join(',') : null });
  };

  const handleResetAll = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const hasActiveFilters =
    Boolean(qParam) ||
    availableNowParam ||
    selectedCategories.length > 0 ||
    selectedGenres.length > 0 ||
    selectedLanguages.length > 0;

  return (
    <div className="py-8 md:py-10 space-y-8">
      {/* Page Heading & Search Bar matching Figma node 6:2206 */}
      <div className="space-y-5">
        <div className="space-y-2">
          <h1 className="font-serif text-[36px] md:text-[42px] leading-tight text-brand-ink font-normal">
            The book catalog
          </h1>
          <p className="text-[15px] text-brand-slate">
            Explore the shelves, check availability and save a copy for your next
            visit.
          </p>
        </div>

        <form
          onSubmit={handleSearchSubmit}
          className="bg-white rounded-[10px] border border-brand-border p-1.5 pl-4 flex items-center gap-3 shadow-[0_1px_4px_rgba(32,59,59,0.03)]"
        >
          <Search className="w-[18px] h-[18px] text-brand-teal shrink-0" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by title, author, ISBN or keyword"
            className="flex-1 bg-transparent text-[14px] text-brand-ink placeholder:text-brand-slate focus:outline-none"
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label="Clear search query"
              className="p-1.5 text-brand-slate hover:text-brand-ink rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            className="h-[40px] px-5 rounded-[8px] bg-brand-teal hover:bg-brand-tealHover text-white font-semibold text-[13px] transition-colors shrink-0"
          >
            Search books
          </button>
        </form>
      </div>

      {/* Main 2-Column Catalog Area */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 items-start">
        {/* Left Filter Sidebar */}
        <aside className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-brand-ink">Filters</h2>
            <button
              type="button"
              onClick={handleResetAll}
              className="text-[12px] font-medium text-brand-teal hover:underline"
            >
              Reset all
            </button>
          </div>

          {/* Availability Filter (Strictly API_Contract.md: Available now) */}
          <div className="space-y-3 pb-4 border-b border-brand-border">
            <button
              type="button"
              onClick={() => toggleSection('availability')}
              className="w-full flex items-center justify-between text-[13px] font-semibold text-brand-ink"
            >
              <span>Availability</span>
              {openSections.availability ? (
                <ChevronUp className="w-4 h-4 text-brand-slate" />
              ) : (
                <ChevronDown className="w-4 h-4 text-brand-slate" />
              )}
            </button>

            {openSections.availability && (
              <div className="space-y-2.5 pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={availableNowParam}
                    onChange={(e) =>
                      updateParams({
                        availableNow: e.target.checked ? 'true' : null,
                      })
                    }
                    className="w-4 h-4 rounded-[4px] border-brand-border text-brand-teal focus:ring-brand-teal accent-[#17645F]"
                  />
                  <span
                    className={`text-[13px] ${
                      availableNowParam
                        ? 'font-semibold text-brand-teal'
                        : 'text-brand-ink'
                    }`}
                  >
                    Available now
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Category Filter */}
          <div className="space-y-3 pb-4 border-b border-brand-border">
            <button
              type="button"
              onClick={() => toggleSection('category')}
              className="w-full flex items-center justify-between text-[13px] font-semibold text-brand-ink"
            >
              <span>Category</span>
              {openSections.category ? (
                <ChevronUp className="w-4 h-4 text-brand-slate" />
              ) : (
                <ChevronDown className="w-4 h-4 text-brand-slate" />
              )}
            </button>

            {openSections.category && (
              <div className="space-y-2.5 pt-1">
                {CATEGORIES.map((cat) => {
                  const checked = selectedCategories.includes(cat);
                  return (
                    <label
                      key={cat}
                      className="flex items-center gap-2.5 cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          toggleMultiFilter('category', selectedCategories, cat)
                        }
                        className="w-4 h-4 rounded-[4px] border-brand-border text-brand-teal focus:ring-brand-teal accent-[#17645F]"
                      />
                      <span
                        className={`text-[13px] ${
                          checked
                            ? 'font-semibold text-brand-teal'
                            : 'text-brand-ink'
                        }`}
                      >
                        {cat}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Genre Filter */}
          <div className="space-y-3 pb-4 border-b border-brand-border">
            <button
              type="button"
              onClick={() => toggleSection('genre')}
              className="w-full flex items-center justify-between text-[13px] font-semibold text-brand-ink"
            >
              <span>Genre</span>
              {openSections.genre ? (
                <ChevronUp className="w-4 h-4 text-brand-slate" />
              ) : (
                <ChevronDown className="w-4 h-4 text-brand-slate" />
              )}
            </button>

            {openSections.genre && (
              <div className="space-y-2.5 pt-1">
                {GENRES.map((genre) => {
                  const checked = selectedGenres.includes(genre);
                  return (
                    <label
                      key={genre}
                      className="flex items-center gap-2.5 cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          toggleMultiFilter('genre', selectedGenres, genre)
                        }
                        className="w-4 h-4 rounded-[4px] border-brand-border text-brand-teal focus:ring-brand-teal accent-[#17645F]"
                      />
                      <span
                        className={`text-[13px] ${
                          checked
                            ? 'font-semibold text-brand-teal'
                            : 'text-brand-ink'
                        }`}
                      >
                        {genre}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Language Filter */}
          <div className="space-y-3 pb-4 border-b border-brand-border">
            <button
              type="button"
              onClick={() => toggleSection('language')}
              className="w-full flex items-center justify-between text-[13px] font-semibold text-brand-ink"
            >
              <span>Language</span>
              {openSections.language ? (
                <ChevronUp className="w-4 h-4 text-brand-slate" />
              ) : (
                <ChevronDown className="w-4 h-4 text-brand-slate" />
              )}
            </button>

            {openSections.language && (
              <div className="space-y-2.5 pt-1">
                {LANGUAGES.map((lang) => {
                  const checked = selectedLanguages.includes(lang);
                  return (
                    <label
                      key={lang}
                      className="flex items-center gap-2.5 cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          toggleMultiFilter('language', selectedLanguages, lang)
                        }
                        className="w-4 h-4 rounded-[4px] border-brand-border text-brand-teal focus:ring-brand-teal accent-[#17645F]"
                      />
                      <span
                        className={`text-[13px] ${
                          checked
                            ? 'font-semibold text-brand-teal'
                            : 'text-brand-ink'
                        }`}
                      >
                        {lang}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Sidebar Callout Card */}
          <div className="rounded-[12px] bg-brand-mint/75 p-4 space-y-2">
            <BookmarkCheck className="w-4 h-4 text-brand-teal" />
            <p className="text-[13px] font-semibold text-brand-ink">
              Reserve for pickup
            </p>
            <p className="text-[12px] leading-[1.55] text-brand-slate">
              Request a hold on any available book. We&apos;ll set aside a copy at
              the main library counter until 3:30 pm the next school day.
            </p>
          </div>
        </aside>

        {/* Right Results Column */}
        <section className="space-y-5">
          {/* Results Header & Sort Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-[15px] font-semibold text-brand-ink">
              {qParam
                ? `${pagination.totalItems} ${
                    pagination.totalItems === 1 ? 'book' : 'books'
                  } for “${qParam}”`
                : `${pagination.totalItems} ${
                    pagination.totalItems === 1 ? 'book' : 'books'
                  } in catalog`}
            </h2>

            <div className="inline-flex items-center gap-2 bg-white border border-brand-border rounded-[8px] px-3 py-1.5 text-[12px]">
              <span className="text-brand-slate">Sort by:</span>
              <select
                value={sortByParam}
                onChange={(e) =>
                  updateParams({
                    sortBy:
                      e.target.value === 'relevance' ? null : e.target.value,
                  })
                }
                aria-label="Sort books by"
                className="bg-transparent font-semibold text-brand-ink focus:outline-none cursor-pointer"
              >
                <option value="relevance">Relevance</option>
                <option value="title">Title (A–Z)</option>
                <option value="publishedYear">Published year</option>
              </select>
            </div>
          </div>

          {/* Active Filter Pills Row */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2">
              {availableNowParam && (
                <button
                  type="button"
                  onClick={() => updateParams({ availableNow: null })}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-brand-mint text-brand-teal text-[12px] font-semibold hover:opacity-85"
                >
                  <span>Available now</span>
                  <X className="w-3 h-3" />
                </button>
              )}

              {selectedCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() =>
                    toggleMultiFilter('category', selectedCategories, cat)
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-brand-mint text-brand-teal text-[12px] font-semibold hover:opacity-85"
                >
                  <span>Category: {cat}</span>
                  <X className="w-3 h-3" />
                </button>
              ))}

              {selectedGenres.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  onClick={() =>
                    toggleMultiFilter('genre', selectedGenres, genre)
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-brand-mint text-brand-teal text-[12px] font-semibold hover:opacity-85"
                >
                  <span>Genre: {genre}</span>
                  <X className="w-3 h-3" />
                </button>
              ))}

              {selectedLanguages.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() =>
                    toggleMultiFilter('language', selectedLanguages, lang)
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-brand-mint text-brand-teal text-[12px] font-semibold hover:opacity-85"
                >
                  <span>Language: {lang}</span>
                  <X className="w-3 h-3" />
                </button>
              ))}

              <span className="text-[12px] text-brand-slate ml-1">
                {availableNowParam
                  ? 'Showing books available right now'
                  : 'Showing available and loaned books'}
              </span>
            </div>
          )}

          {/* Book Cards Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="h-[380px] rounded-[12px] border border-brand-border bg-white animate-pulse"
                />
              ))}
            </div>
          ) : books.length === 0 ? (
            <div className="rounded-[12px] border border-brand-border bg-white p-12 text-center space-y-3">
              <p className="font-serif text-[22px] text-brand-ink">
                No books match your search or filters
              </p>
              <p className="text-[13px] text-brand-slate max-w-md mx-auto">
                Try clearing one of your active filters or searching with a
                broader title, author, or keyword.
              </p>
              <button
                type="button"
                onClick={handleResetAll}
                className="mt-2 inline-flex items-center px-4 py-2 rounded-[8px] bg-brand-teal text-white text-[13px] font-semibold hover:bg-brand-tealHover"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {books.map((book) => {
                const { availableCopies, totalCopies } = book.stockSummary;
                const isAvailable = availableCopies > 0;

                return (
                  <Link
                    key={book._id}
                    to={`/books/${book._id}`}
                    className="group rounded-[12px] border border-brand-border bg-white overflow-hidden flex flex-col hover:border-brand-teal/60 transition-all hover:shadow-sm"
                  >
                    <div className="bg-brand-beige h-[228px] flex items-center justify-center px-6">
                      <div className="transition-transform duration-200 group-hover:-translate-y-1">
                        <BookCoverGraphic
                          title={book.title}
                          author={book.author}
                          size="md"
                        />
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-2.5">
                        <h3 className="font-serif font-semibold text-[18px] leading-snug text-brand-ink group-hover:text-brand-teal transition-colors">
                          {book.title}
                        </h3>
                        <p className="text-[13px] text-brand-slate">
                          {book.author}
                        </p>

                        {/* Stock Availability Pill */}
                        <div>
                          {isAvailable ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-brand-mint text-brand-teal text-[12px] font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-teal" />
                              <span>{availableCopies} available</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-brand-amberSurface text-brand-amberText text-[12px] font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-amberText" />
                              <span>All copies on loan</span>
                            </span>
                          )}
                        </div>

                        <p className="text-[12px] text-brand-slate">
                          {book.shelfReference || 'Main library'} · {totalCopies}{' '}
                          {totalCopies === 1 ? 'copy' : 'copies'} total
                        </p>
                      </div>

                      <div className="pt-1 flex items-center justify-between text-[13px] font-semibold text-brand-teal">
                        <span className="group-hover:underline">View book</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Pagination Footer */}
          {pagination.totalItems > 0 && (
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-brand-slate">
              <span>
                {pagination.totalPages === 1
                  ? `Showing all ${pagination.totalItems} results`
                  : `Showing ${books.length} of ${pagination.totalItems} results (Page ${pagination.currentPage} of ${pagination.totalPages})`}
              </span>

              <div className="flex items-center gap-1.5">
                {Array.from(
                  { length: pagination.totalPages },
                  (_, idx) => idx + 1,
                ).map((pageNum) => {
                  const isCurrent = pageNum === pagination.currentPage;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() =>
                        updateParams({
                          page: pageNum === 1 ? null : String(pageNum),
                        })
                      }
                      className={`w-8 h-8 rounded-[6px] text-[13px] font-semibold transition-colors ${
                        isCurrent
                          ? 'bg-brand-teal text-white'
                          : 'bg-white border border-brand-border text-brand-ink hover:border-brand-teal'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
