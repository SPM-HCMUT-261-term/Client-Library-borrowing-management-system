import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowDown,
  Search,
  BookmarkPlus,
  BookOpen,
} from 'lucide-react';
import { getFeaturedBooksApi } from '../api/endpoints';
import { FeaturedBookItem } from '../types/api';
import { BookCoverGraphic } from '../components/BookCoverGraphic';

// Figma genre subtitle mapping for the 4 featured shelf cards on Guest Landing (26:873)
function getGuestCardSubtitle(book: FeaturedBookItem): string {
  if (book.title.toLowerCase().includes('mango street')) {
    return 'Coming of age';
  }
  return book.genre || book.category;
}

export const GuestLandingPage: React.FC = () => {
  const [featuredBooks, setFeaturedBooks] = useState<FeaturedBookItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    const loadFeatured = async () => {
      setIsLoading(true);
      try {
        const items = await getFeaturedBooksApi(4);
        if (active) {
          setFeaturedBooks(items);
        }
      } catch (err) {
        console.error('Failed to load featured books:', err);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadFeatured();
    const handleReset = () => void loadFeatured();
    window.addEventListener('mock-db-reset', handleReset);
    return () => {
      active = false;
      window.removeEventListener('mock-db-reset', handleReset);
    };
  }, []);

  return (
    <div className="py-8 md:py-10 space-y-12">
      {/* Hero Banner matching Figma node 26:873 */}
      <section className="rounded-[16px] bg-brand-beige overflow-hidden grid grid-cols-1 lg:grid-cols-[1fr_400px] min-h-[326px]">
        <div className="p-8 md:px-12 md:py-10 flex flex-col justify-between gap-6">
          <div className="space-y-4 max-w-[640px]">
            <p className="text-[11px] font-semibold tracking-[0.06em] uppercase text-brand-teal">
              WELCOME TO WESTBRIDGE SCHOOL LIBRARY
            </p>
            <h1 className="font-serif text-[34px] md:text-[42px] leading-[1.18] text-brand-ink font-normal">
              Your next chapter starts here.
            </h1>
            <p className="text-[15px] leading-[1.6] text-brand-slate max-w-[520px]">
              Find a new favourite, a class read or the answer to a big question.
              <br className="hidden sm:inline" /> Sign in to explore the catalog
              and save a book for your next visit.
            </p>
          </div>

          <div className="space-y-4 pt-1">
            <div className="flex flex-wrap items-center gap-6">
              <Link
                to="/login"
                className="inline-flex items-center gap-2.5 h-[46px] px-5 rounded-[8px] bg-brand-teal hover:bg-brand-tealHover text-white font-semibold text-[14px] transition-colors"
              >
                <span>Sign in to Chapter</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href="#how-borrowing-works"
                className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand-teal hover:underline"
              >
                <span>How borrowing works</span>
                <ArrowDown className="w-3.5 h-3.5" />
              </a>
            </div>

            <p className="text-[12px] text-brand-slate">
              For students, library staff and administrators · School-issued
              accounts only
            </p>
          </div>
        </div>

        {/* Reading Room Image Panel */}
        <div className="relative min-h-[260px] lg:min-h-full w-full">
          <img
            src="/images/reading-room.png"
            alt="Westbridge School Library reading corner"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-4 bg-white px-3.5 py-2 rounded-[6px] shadow-sm">
            <span className="text-[12px] font-medium text-brand-ink">
              A little curiosity goes a long way.
            </span>
          </div>
        </div>
      </section>

      {/* How Borrowing Works (3-step strip) */}
      <section id="how-borrowing-works" className="space-y-6 pt-2">
        <h2 className="font-serif text-[25px] leading-snug text-brand-ink font-normal">
          Find it online. Borrow it at the library.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-[8px] bg-brand-mint text-brand-teal flex items-center justify-center shrink-0 mt-0.5">
              <Search className="w-[18px] h-[18px]" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-[14px] font-semibold text-brand-ink">
                1. Discover a book
              </h3>
              <p className="text-[13px] leading-[1.55] text-brand-slate">
                Sign in to search by title, author or subject and check which
                copies are available.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-[8px] bg-brand-mint text-brand-teal flex items-center justify-center shrink-0 mt-0.5">
              <BookmarkPlus className="w-[18px] h-[18px]" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-[14px] font-semibold text-brand-ink">
                2. Request a hold
              </h3>
              <p className="text-[13px] leading-[1.55] text-brand-slate">
                Reserve an available copy online so it is set aside for you at
                the library counter.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-[8px] bg-brand-mint text-brand-teal flex items-center justify-center shrink-0 mt-0.5">
              <BookOpen className="w-[18px] h-[18px]" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-[14px] font-semibold text-brand-ink">
                3. Collect at the counter
              </h3>
              <p className="text-[13px] leading-[1.55] text-brand-slate">
                Bring your student ID. Staff confirm your loan at collection and
                record returns.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Shelves Section */}
      <section className="space-y-5 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="space-y-1.5">
            <h2 className="font-serif text-[25px] leading-snug text-brand-ink font-normal">
              A few stories from our shelves
            </h2>
            <p className="text-[13px] text-brand-slate">
              Familiar favourites and new possibilities. Check availability in
              the catalog after signing in.
            </p>
          </div>

          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-teal hover:underline shrink-0"
          >
            <span>Sign in to explore the catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-[340px] rounded-[12px] border border-brand-border bg-white animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredBooks.map((book) => (
              <Link
                key={book._id}
                to="/login"
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
                  <h3 className="font-serif font-semibold text-[17px] leading-snug text-brand-ink group-hover:text-brand-teal transition-colors">
                    {book.title}
                  </h3>
                  <div className="space-y-1">
                    <p className="text-[13px] text-brand-slate">{book.author}</p>
                    <p className="text-[12px] text-brand-teal font-normal">
                      {getGuestCardSubtitle(book)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
