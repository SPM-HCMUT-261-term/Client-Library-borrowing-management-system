import React from 'react';
import { BookOpen } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserMenuDropdown } from '../UserMenuDropdown';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navClass = ({ isActive }: { isActive: boolean }) =>
  `relative h-full flex items-center text-[14px] transition-colors ${
    isActive
      ? 'font-semibold text-brand-teal'
      : 'font-normal text-brand-slate hover:text-brand-ink'
  }`;

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
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
              <NavLink to="/admin/accounts" className={navClass}>
                {({ isActive }) => <><span>Accounts</span>{isActive && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-brand-teal" />}</>}
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden lg:inline-flex h-6 items-center px-2.5 rounded-[5px] bg-brand-beige text-[11px] font-semibold text-brand-slate">Admin workspace</span>
            {user && (
              <UserMenuDropdown
                user={user}
                profileLink={{ to: '/admin/profile', label: 'My profile' }}
                onLogout={handleLogout}
              />
            )}
          </div>
        </div>
      </header>
      <main className="max-w-[1440px] mx-auto px-6 lg:px-12 pb-16">{children}</main>
    </div>
  );
};
