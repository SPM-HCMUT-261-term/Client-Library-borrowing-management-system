import React from 'react';
import { BookOpen } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserMenuDropdown } from '../UserMenuDropdown';

interface StaffLayoutProps {
  children: React.ReactNode;
}

const staffNavItems = [
  {
    to: '/staff/issue',
    end: false,
    label: 'Lend book',
    dot: 'bg-[#E97700]',
    activeClass:
      'bg-[#FFF4E6] border-[#F5C78E] text-[#D96C00] font-semibold shadow-sm',
    inactiveClass:
      'bg-brand-canvas/60 border-brand-border text-brand-slate hover:bg-[#FFF4E6]/80 hover:border-[#F5D0A9] hover:text-[#D96C00]',
  },
  {
    to: '/staff/return',
    end: false,
    label: 'Return book',
    dot: 'bg-[#3B6EF5]',
    activeClass:
      'bg-[#EDF2FF] border-[#BBD0FF] text-[#315FF4] font-semibold shadow-sm',
    inactiveClass:
      'bg-brand-canvas/60 border-brand-border text-brand-slate hover:bg-[#EDF2FF]/80 hover:border-[#C6D7FF] hover:text-[#315FF4]',
  },
  {
    to: '/staff/books',
    end: false,
    label: 'Inventory',
    dot: 'bg-[#17645F]',
    activeClass:
      'bg-[#E8F5EF] border-[#A7D7C5] text-[#17645F] font-semibold shadow-sm',
    inactiveClass:
      'bg-brand-canvas/60 border-brand-border text-brand-slate hover:bg-[#E8F5EF]/80 hover:border-[#B7DFCC] hover:text-[#17645F]',
  },
  {
    to: '/staff/loans',
    end: false,
    label: 'Records',
    dot: 'bg-[#7C3AED]',
    activeClass:
      'bg-[#F2EEFF] border-[#D4C2FF] text-[#7C3AED] font-semibold shadow-sm',
    inactiveClass:
      'bg-brand-canvas/60 border-brand-border text-brand-slate hover:bg-[#F2EEFF]/80 hover:border-[#DDD0FF] hover:text-[#7C3AED]',
  },
] as const;

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

            <nav className="hidden md:flex items-center gap-2">
              {staffNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `h-9 px-3.5 rounded-lg border inline-flex items-center gap-2 text-[13.5px] font-medium transition-all whitespace-nowrap ${
                      isActive ? item.activeClass : item.inactiveClass
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 transition-opacity ${
                          item.dot
                        } ${isActive ? 'opacity-100' : 'opacity-70'}`}
                      />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden lg:inline-flex h-6 items-center px-2.5 rounded-[5px] bg-brand-beige text-[11px] font-semibold text-brand-slate">
              Staff workspace
            </span>
            {user && (
              <UserMenuDropdown
                user={user}
                profileLink={{ to: '/staff/profile', label: 'My profile' }}
                onLogout={handleLogout}
              />
            )}
          </div>
        </div>
      </header>
      <main className="max-w-[1440px] mx-auto px-6 lg:px-12 pb-16">
        {children}
      </main>
    </div>
  );
};
