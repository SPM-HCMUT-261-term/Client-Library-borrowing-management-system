import React from 'react';
import { BookOpen } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navClass = ({ isActive }: { isActive: boolean }) =>
  `relative h-full flex items-center text-[14px] transition-colors ${
    isActive
      ? 'font-semibold text-brand-teal'
      : 'font-normal text-brand-slate hover:text-brand-ink'
  }`;

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => (
  <div className="min-h-screen bg-brand-canvas text-brand-ink">
    <header className="h-[80px] bg-white border-b border-brand-border sticky top-0 z-30">
      <div className="max-w-[1440px] mx-auto h-full px-6 lg:px-12 flex items-center justify-between gap-6">
        <div className="flex items-center gap-8 lg:gap-12 h-full min-w-0">
          <Link to="/admin" className="flex items-center gap-3 shrink-0">
            <span className="w-9 h-9 rounded-[11px] bg-brand-teal text-white flex items-center justify-center">
              <BookOpen className="w-[21px] h-[21px] stroke-[1.8]" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-serif font-semibold text-[23px] leading-[29px]">Chapter</span>
              <span className="text-[9px] leading-[13px] tracking-[0.01em] text-brand-slate">WESTBRIDGE SCHOOL LIBRARY</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 h-full">
            <NavLink to="/admin" end className={navClass}>
              {({ isActive }) => <><span>Home</span>{isActive && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-brand-teal" />}</>}
            </NavLink>
            <NavLink to="/admin/accounts" className={navClass}>
              {({ isActive }) => <><span>Accounts</span>{isActive && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-brand-teal" />}</>}
            </NavLink>
            <span className="h-full flex items-center text-[14px] text-brand-slate" aria-disabled="true">Violations</span>
            <span className="h-full flex items-center text-[14px] text-brand-slate" aria-disabled="true">Activity log</span>
          </nav>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden lg:inline-flex h-6 items-center px-2 rounded-[5px] bg-brand-beige text-[11px] font-semibold text-brand-slate">Admin workspace</span>
          <Link to="/admin/profile" className="h-10 px-4 rounded-md border border-brand-border bg-white inline-flex items-center justify-center text-[13px] font-semibold text-brand-teal hover:border-brand-teal transition-colors">My profile</Link>
        </div>
      </div>
    </header>
    <main className="max-w-[1440px] mx-auto px-6 lg:px-12 pb-16">{children}</main>
  </div>
);
