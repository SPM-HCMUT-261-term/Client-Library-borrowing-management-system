import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ArrowLeft,
  ArrowRight,
  Bell,
  ChevronDown,
  Clock,
  ArrowUpRight,
  LogOut,
  User as UserIcon,
} from 'lucide-react';

export interface LayoutUser {
  _id: string;
  accountId: string;
  fullName: string;
  initials: string;
  role: 'student' | 'staff' | 'admin';
  yearGroup: string | null;
  activeLoansCount?: number;
  maxLoansLimit?: number;
}

export interface LayoutProps {
  children: React.ReactNode;
  variant?: 'guest' | 'auth' | 'student';
  user?: LayoutUser | null;
  onLogout?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  variant = 'guest',
  user = null,
  onLogout,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isCatalogActive =
    location.pathname.startsWith('/books') ||
    location.pathname.startsWith('/holds');
  const isBorrowingActive = location.pathname.startsWith('/my-borrowing');
  const isHomeActive = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-brand-canvas text-brand-ink">
      {/* Top Library Navigation (88px height matching Figma) */}
      <header className="h-[88px] bg-white border-b border-brand-border sticky top-0 z-30">
        <div className="max-w-[1440px] mx-auto h-full px-6 md:px-16 flex items-center justify-between gap-8">
          <div className="flex items-center gap-12 lg:gap-[60px] h-full">
            {/* Brand Identity */}
            <Link to="/" className="flex items-center gap-3 shrink-0 group">
              <div className="w-10 h-10 rounded-[8px] bg-brand-teal flex items-center justify-center text-white transition-colors group-hover:bg-brand-tealHover">
                <BookOpen className="w-5 h-5 stroke-[1.75]" />
              </div>
              <div className="flex flex-col gap-[2px]">
                <span className="font-serif font-semibold text-[23px] leading-[29px] text-brand-ink tracking-tight">
                  Chapter
                </span>
                <span className="font-sans font-medium text-[10px] leading-[12px] text-brand-slate tracking-[0.04em] uppercase">
                  WESTBRIDGE SCHOOL LIBRARY
                </span>
              </div>
            </Link>

            {/* Primary Navigation Links */}
            {variant === 'auth' ? (
              <nav className="flex items-center h-full">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 text-[14px] text-brand-teal hover:underline font-normal"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to home</span>
                </Link>
              </nav>
            ) : variant === 'student' && user ? (
              <nav className="hidden sm:flex items-center gap-8 h-full">
                <NavLink
                  to="/"
                  end
                  className={`relative h-full flex items-center text-[14px] transition-colors ${
                    isHomeActive
                      ? 'font-semibold text-brand-teal'
                      : 'font-normal text-brand-slate hover:text-brand-ink'
                  }`}
                >
                  Home
                  {isHomeActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-teal" />
                  )}
                </NavLink>

                <NavLink
                  to="/books"
                  className={`relative h-full flex items-center text-[14px] transition-colors ${
                    isCatalogActive
                      ? 'font-semibold text-brand-teal'
                      : 'font-normal text-brand-slate hover:text-brand-ink'
                  }`}
                >
                  Book catalog
                  {isCatalogActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-teal" />
                  )}
                </NavLink>

                <NavLink
                  to="/my-borrowing"
                  className={`relative h-full flex items-center text-[14px] transition-colors ${
                    isBorrowingActive
                      ? 'font-semibold text-brand-teal'
                      : 'font-normal text-brand-slate hover:text-brand-ink'
                  }`}
                >
                  My borrowing
                  {isBorrowingActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-teal" />
                  )}
                </NavLink>
              </nav>
            ) : (
              <nav className="hidden sm:flex items-center gap-8 h-full">
                <Link
                  to="/"
                  className="relative h-full flex items-center text-[14px] font-semibold text-brand-teal"
                >
                  Home
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-teal" />
                </Link>
                <a
                  href="#how-borrowing-works"
                  className="h-full flex items-center text-[14px] font-normal text-brand-slate hover:text-brand-ink transition-colors"
                >
                  How borrowing works
                </a>
              </nav>
            )}
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-5">
            {variant === 'auth' ? (
              <span className="text-[13px] text-brand-teal hidden md:inline">
                Need help? Ask at the library counter
              </span>
            ) : variant === 'student' && user ? (
              <div className="flex items-center gap-5">
                <button
                  type="button"
                  onClick={() => navigate('/my-borrowing')}
                  title="Borrowing & notifications"
                  className="p-2 rounded-full text-brand-slate hover:text-brand-ink hover:bg-brand-canvas transition-colors"
                >
                  <Bell className="w-[18px] h-[18px]" />
                </button>

                {/* User Chip Dropdown */}
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((prev) => !prev)}
                    className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-brand-canvas transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-brand-mint text-brand-teal font-semibold text-[12px] flex items-center justify-center shrink-0">
                      {user.initials}
                    </div>
                    <div className="hidden sm:flex flex-col">
                      <span className="text-[13px] font-semibold text-brand-ink leading-tight">
                        {user.fullName}
                      </span>
                      <span className="text-[11px] text-brand-slate leading-tight mt-0.5">
                        {user.yearGroup ? `${user.yearGroup} · ` : ''}
                        {user.accountId}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-brand-slate" />
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-brand-border shadow-lg py-2 z-50">
                      <div className="px-4 py-2 border-b border-brand-border sm:hidden">
                        <p className="text-[13px] font-semibold text-brand-ink">
                          {user.fullName}
                        </p>
                        <p className="text-[11px] text-brand-slate">
                          {user.yearGroup ? `${user.yearGroup} · ` : ''}
                          {user.accountId}
                        </p>
                      </div>
                      <Link
                        to="/my-borrowing"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-brand-ink hover:bg-brand-canvas"
                      >
                        <UserIcon className="w-4 h-4 text-brand-teal" />
                        <span>My borrowing ({user.activeLoansCount ?? 2} / {user.maxLoansLimit ?? 5})</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onLogout?.();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-red-700 hover:bg-red-50 text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2.5 h-[42px] px-5 rounded-[8px] bg-brand-teal hover:bg-brand-tealHover text-white font-semibold text-[14px] transition-colors"
              >
                <span>Sign in</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-6 md:px-16">
        {children}
      </main>

      {/* Library Footer */}
      <footer className="border-t border-brand-border bg-brand-canvas mt-16">
        <div className="max-w-[1440px] mx-auto px-6 md:px-16 h-[68px] flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-brand-slate">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-brand-teal" />
            <span>Library open Mon–Fri, 8:00 am–4:00 pm</span>
          </div>

          <a
            href="#counter-help"
            onClick={(e) => e.preventDefault()}
            className="inline-flex items-center gap-1 text-brand-teal hover:underline font-medium"
          >
            <span>Need a hand? Ask at the library counter</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>

          <span>Chapter · Westbridge School</span>
        </div>
      </footer>
    </div>
  );
};
