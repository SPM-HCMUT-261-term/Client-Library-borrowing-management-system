import React from 'react';
import { ArrowDownLeft, ArrowUpRight, BookCopy, Clock3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatBorrowingToday } from '../../utils/borrowingDates';

const cards = [
  {
    title: 'New Borrow',
    description:
      'Find a student and check out several physical copies together.',
    icon: ArrowUpRight,
    to: '/staff/issue',
    surface: 'bg-[#FFF4E6]',
    accent: 'bg-[#E97700] text-white',
    titleColor: 'text-[#D96C00]',
  },
  {
    title: 'Return Book',
    description:
      'Find a borrowed copy, check its condition and confirm the return.',
    icon: ArrowDownLeft,
    to: '/staff/return',
    surface: 'bg-[#EDF2FF]',
    accent: 'bg-[#3B6EF5] text-white',
    titleColor: 'text-[#315FF4]',
  },
  {
    title: 'Manage Books',
    description:
      'Browse inventory, add books and manage title details and physical copies.',
    icon: BookCopy,
    to: '/staff/books',
    surface: 'bg-[#E8F5EF]',
    accent: 'bg-[#17645F] text-white',
    titleColor: 'text-[#17645F]',
  },
  {
    title: 'History',
    description:
      'View active loans and returned history. Search by student, book or copy.',
    icon: Clock3,
    surface: 'bg-[#F2EEFF]',
    accent: 'bg-[#7C3AED] text-white',
    titleColor: 'text-[#7C3AED]',
  },
];

export const StaffHomePage: React.FC = () => (
  <div className="pt-8">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[13px] text-brand-slate">
      <span>Home</span>
      <span>{formatBorrowingToday()}</span>
    </div>
    <h1 className="mt-2 font-serif text-[32px] leading-[40px] font-semibold text-brand-ink">
      Staff home
    </h1>
    <p className="mt-1.5 text-[14px] text-brand-slate">
      Choose a function to get started.
    </p>

    <div className="mt-7 grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-[934px]">
      {cards.map((card) => {
        const Icon = card.icon;
        const content = (
          <>
            <span
              className={`w-12 h-12 rounded-[11px] flex items-center justify-center shrink-0 ${card.accent}`}
            >
              <Icon className="w-[23px] h-[23px] stroke-[1.8]" />
            </span>
            <span className="flex flex-col gap-1.5 text-left">
              <span className={`text-[17px] font-semibold ${card.titleColor}`}>
                {card.title}
              </span>
              <span className="text-[14px] leading-5 text-brand-slate max-w-[330px]">
                {card.description}
              </span>
            </span>
          </>
        );

        return card.to ? (
          <Link
            key={card.title}
            to={card.to}
            className={`min-h-[188px] rounded-xl border border-brand-border p-5 flex items-center gap-4 transition-transform hover:-translate-y-0.5 ${card.surface}`}
          >
            {content}
          </Link>
        ) : (
          <div
            key={card.title}
            aria-disabled="true"
            className={`min-h-[188px] rounded-xl border border-brand-border p-5 flex items-center gap-4 opacity-80 ${card.surface}`}
          >
            {content}
          </div>
        );
      })}
    </div>
  </div>
);
