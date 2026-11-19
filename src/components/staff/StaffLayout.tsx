import React from 'react';
import { BookOpen, LogOut } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface StaffLayoutProps {
  children: React.ReactNode;
}

const navClass = ({ isActive }: { isActive: boolean }) =>
  `relative h-full flex items-center text-[14px] transition-colors ${
    isActive
      ? 'font-semibold text-brand-teal'
      : 'font-normal text-brand-slate hover:text-brand-ink'
  }`;

export const StaffLayout: React.FC<StaffLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-brand-canvas text-brand-ink">
      <header className="h-[80px] bg-white border-b border-brand-border sticky top-0 z-30">
        <div className="max-w-[1440px] mx-auto h-full px-6 lg:px-12 flex items-center justify-between gap-6">
          <div className="flex items-center gap-8 lg:gap-12 h-full min-w-0">
            <Link to="/staff" className="flex items-center gap-3 shrink-0">
              <span className="w-9 h-9 rounded-[11px] bg-brand-teal text-white flex items-center justify-center">
                <BookOpen className="w-[21px] h-[21px] stroke-[1.8]" />
              </span>
              <span className="flex flex-col leading-none">
                <span className="font-serif font-semibold text-[23px] leading-[29px]">
                  Chapter
                </span>
                <span className="text-[9px] leading-[13px] tracking-[0.01em] text-brand-slate">
                  WESTBRIDGE SCHOOL LIBRARY
                </span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8 h-full">
              <NavLink to="/staff" end className={navClass}>
                {({ isActive }) => (
                  <>
                    <span>Home</span>
                    {isActive && (
                      <span className="absolute bottom-0 inset-x-0 h-0.5 bg-brand-teal" />
                    )}
                  </>
                )}
              </NavLink>
              <NavLink to="/staff/issue" className={navClass}>
                {({ isActive }) => (
                  <>
                    <span>Borrowing &amp; returns</span>
                    {isActive && (
                      <span className="absolute bottom-0 inset-x-0 h-0.5 bg-brand-teal" />
                    )}
                  </>
                )}
              </NavLink>
              <NavLink to="/staff/books" className={navClass}>
                {({ isActive }) => (
                  <>
                    <span>Books &amp; copies</span>
                    {isActive && (
                      <span className="absolute bottom-0 inset-x-0 h-0.5 bg-brand-teal" />
                    )}
                  </>
                )}
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden lg:inline-flex h-6 items-center px-2.5 rounded-[5px] bg-brand-beige text-[11px] font-semibold text-brand-slate">
              Staff workspace
            </span>
            {user && (
              <div className="hidden sm:flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg border border-brand-border bg-brand-canvas/60">
                <span className="w-7 h-7 rounded-full bg-brand-mint text-brand-teal text-[11px] font-bold flex items-center justify-center">
                  {user.initials}
                </span>
                <span className="text-[12px] leading-tight">
                  <span className="block font-semibold text-brand-ink">
                    {user.fullName}
                  </span>
                  <span className="block text-[11px] text-brand-slate">
                    {user.accountId}
                  </span>
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="h-10 px-3.5 rounded-md border border-brand-border bg-white inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-teal hover:border-brand-teal transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-[1440px] mx-auto px-6 lg:px-12 pb-16">
        {children}
      </main>
    </div>
  );
};
