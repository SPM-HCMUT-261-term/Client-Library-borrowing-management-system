import React from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ArrowLeft,
  ArrowRight,
  Bell,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { UserMenuDropdown } from './UserMenuDropdown';

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

  const isCatalogActive =
    location.pathname.startsWith('/books') ||
    location.pathname.startsWith('/holds');

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
                  SCHOOL LIBRARY
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
                  to="/books"
                  className={`relative h-full flex items-center text-[14px] transition-colors ${
                    isCatalogActive
                      ? 'font-semibold text-brand-teal'
                      : 'font-normal text-brand-slate hover:text-brand-ink'
                  }`}
                >
                  Browse books
                  {isCatalogActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-teal" />
                  )}
                </NavLink>
              </nav>
            ) : (
              <nav className="hidden sm:flex items-center gap-8 h-full">
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
                <UserMenuDropdown
                  user={user}
                  profileLink={{
                    to: '/profile',
                    label: 'My profile',
                  }}
                  secondaryLink={{
                    to: '/my-borrowing',
                    label: `My borrowing (${user.activeLoansCount ?? 0} / ${user.maxLoansLimit ?? 5})`,
                  }}
                  onLogout={() => onLogout?.()}
                />
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
