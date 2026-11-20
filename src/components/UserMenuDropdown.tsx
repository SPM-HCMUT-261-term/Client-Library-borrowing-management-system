import React, { useEffect, useRef, useState } from 'react';
import { BookMarked, ChevronDown, LogOut, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface UserMenuUser {
  accountId: string;
  fullName: string;
  initials: string;
  role: 'student' | 'staff' | 'admin';
  yearGroup?: string | null;
}

interface UserMenuLink {
  to: string;
  label: string;
}

interface UserMenuDropdownProps {
  user: UserMenuUser;
  profileLink?: UserMenuLink;
  secondaryLink?: UserMenuLink;
  onLogout: () => void | Promise<void>;
}

function getSubtitle(user: UserMenuUser): string {
  if (user.role === 'student') {
    return `${user.yearGroup ? `${user.yearGroup} · ` : ''}${user.accountId}`;
  }
  const roleLabel = user.role === 'admin' ? 'Admin' : 'Staff';
  return `${roleLabel} · ${user.accountId}`;
}

export const UserMenuDropdown: React.FC<UserMenuDropdownProps> = ({
  user,
  profileLink,
  secondaryLink,
  onLogout,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const subtitle = getSubtitle(user);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
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
            {subtitle}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-brand-slate transition-transform ${
            menuOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-brand-border shadow-lg py-2 z-50"
        >
          <div className="px-4 py-2 border-b border-brand-border sm:hidden">
            <p className="text-[13px] font-semibold text-brand-ink">
              {user.fullName}
            </p>
            <p className="text-[11px] text-brand-slate">{subtitle}</p>
          </div>

          {profileLink && (
            <Link
              to={profileLink.to}
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-brand-ink hover:bg-brand-canvas"
            >
              <UserIcon className="w-4 h-4 text-brand-teal" />
              <span>{profileLink.label}</span>
            </Link>
          )}

          {secondaryLink && (
            <Link
              to={secondaryLink.to}
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-brand-ink hover:bg-brand-canvas"
            >
              <BookMarked className="w-4 h-4 text-brand-teal" />
              <span>{secondaryLink.label}</span>
            </Link>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              void onLogout();
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-red-700 hover:bg-red-50 text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
};
