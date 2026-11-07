import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowUpRight,
  ArrowRight,
  BookmarkPlus,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getFeaturedBooksApi } from '../api/endpoints';
import { FeaturedBookItem } from '../types/api';
import { BookCoverGraphic } from '../components/BookCoverGraphic';

function getFeaturedSubtitle(book: FeaturedBookItem): string {
  if (book.title.toLowerCase().includes('mango street')) {
    return 'Coming of age';
  }
  return book.genre || book.category;
}

export const StudentHomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [featuredBooks, setFeaturedBooks] = useState<FeaturedBookItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'Reader';

  useEffect(() => {
    let active = true;
    const loadFeatured = async () => {
      setIsLoading(true);
      try {
        const data = await getFeaturedBooksApi(4);
        if (active) {
          setFeaturedBooks(data);
        }
      } catch (err) {
        console.error('Failed to fetch featured books:', err);
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      navigate(`/books?q=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/books');
    }
  };

  return (
    <div className="py-7 md:py-9 space-y-11">
      {/* Top Personalized Greeting Strip matching Figma node 6:2053 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[13px] text-brand-slate">
        <span className="font-medium text-brand-ink/80">
          Good morning, {firstName}.
        </span>
        <span className="text-[12px]">Thursday, 15 October 2026</span>
      </div>

      {/* Hero Search Card */}
      <section className="rounded-[16px] bg-brand-beige overflow-hidden grid grid-cols-1 lg:grid-cols-[1fr_365px] min-h-[288px]">
        <div className="p-8 md:px-12 md:py-10 flex flex-col justify-between gap-6">
          <div className="space-y-3">
            <h1 className="font-serif text-[34px] md:text-[42px] leading-[1.18] text-brand-ink font-normal">
              Your next chapter starts here.
            </h1>
            <p className="text-[15px] text-brand-slate">
              Find a new favourite, a class read or the answer to a big question.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="bg-white rounded-[10px] border border-brand-border p-1.5 pl-4 flex items-center gap-3 shadow-[0_1px_4px_rgba(32,59,59,0.03)]">
              <Search className="w-4 h-4 text-brand-slate shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, author, ISBN or keyword"
                className="flex-1 bg-transparent text-[14px] text-brand-ink placeholder:text-brand-slate focus:outline-none"
              />
              <button
                type="submit"
                className="h-[40px] px-5 rounded-[7px] bg-brand-teal hover:bg-brand-tealHover text-white font-semibold text-[13px] transition-colors shrink-0"
              >
                Search books
              </button>
            </div>

            {/* Quick Explore Chips */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px]">
              <span className="text-brand-slate">Explore:</span>
              <Link
                to="/books?category=Fiction&q=fiction"
                className="inline-flex items-center gap-0.5 font-semibold text-brand-teal hover:underline"
              >
                <span>Fiction</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/books?q=science"
                className="inline-flex items-center gap-0.5 font-semibold text-brand-teal hover:underline"
              >
                <span>Science</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/books?q=history"
                className="inline-flex items-center gap-0.5 font-semibold text-brand-teal hover:underline"
              >
                <span>History</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/books?category=Graphic+novels"
                className="inline-flex items-center gap-0.5 font-semibold text-brand-teal hover:underline"
              >
                <span>Graphic novels</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </form>
        </div>

        <div className="relative min-h-[240px] lg:min-h-full w-full">
          <img
            src="/images/reading-room.png"
            alt="Westbridge School Library reading room"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-4 bg-white px-3.5 py-2 rounded-[6px] shadow-sm">
            <span className="text-[12px] font-medium text-brand-ink">
              A little curiosity goes a long way.
            </span>
          </div>
        </div>
      </section>

      {/* How Borrowing Works 3-step section */}
      <section className="space-y-6 pt-1">
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
                Search by title, author or subject and check which copies are
                available on the shelf.
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
                Reserve an available copy online so staff set it aside for you at
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

      {/* Featured Books Section */}
      <section className="space-y-5 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="space-y-1.5">
            <h2 className="font-serif text-[25px] leading-snug text-brand-ink font-normal">
              A few stories from our shelves
            </h2>
            <p className="text-[13px] text-brand-slate">
              Familiar favourites and new possibilities. Select a book to view
              copy availability or request a hold.
            </p>
          </div>

          <Link
            to="/books"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-teal hover:underline shrink-0"
          >
            <span>Explore the book catalog</span>
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
                  <h3 className="font-serif font-semibold text-[17px] leading-snug text-brand-ink group-hover:text-brand-teal transition-colors">
                    {book.title}
                  </h3>
                  <div className="space-y-1">
                    <p className="text-[13px] text-brand-slate">{book.author}</p>
                    <p className="text-[12px] text-brand-teal font-normal">
                      {getFeaturedSubtitle(book)}
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
