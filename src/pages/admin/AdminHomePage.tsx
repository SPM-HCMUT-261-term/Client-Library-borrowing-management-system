import React from 'react';
import { Clock3, Shield, UserRound, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';

const cards = [
  {
    title: 'Accounts',
    description: 'Find school accounts, manage roles, and review access restrictions.',
    icon: UsersRound,
    to: '/admin/accounts',
    surface: 'bg-[#E8F5EF]',
    accent: 'bg-[#2E8B57] text-white',
    titleColor: 'text-[#2E8B57]',
  },
  {
    title: 'Violations',
    description: 'Review overdue loans, unpaid fines, and cases ready to clear.',
    icon: Shield,
    surface: 'bg-[#FFF4E6]',
    accent: 'bg-[#E97700] text-white',
    titleColor: 'text-[#D96C00]',
  },
  {
    title: 'Activity log',
    description: 'Review account changes, automated restrictions, and circulation history.',
    icon: Clock3,
    surface: 'bg-[#F2EEFF]',
    accent: 'bg-[#7C3AED] text-white',
    titleColor: 'text-[#7C3AED]',
  },
  {
    title: 'My profile',
    description: 'View your school account and end your admin session.',
    icon: UserRound,
    to: '/admin/profile',
    surface: 'bg-[#EDF2FF]',
    accent: 'bg-[#3B6EF5] text-white',
    titleColor: 'text-[#315FF4]',
  },
];

export const AdminHomePage: React.FC = () => (
  <div>
    <AdminPageHeader
      breadcrumb="Home"
      title="Admin home"
      description="Choose a function to get started."
    />
    <div className="mt-[27px] grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-[934px]">
      {cards.map((card) => {
        const Icon = card.icon;
        const content = (
          <>
            <span className={`w-12 h-12 rounded-[11px] flex items-center justify-center shrink-0 ${card.accent}`}>
              <Icon className="w-[23px] h-[23px] stroke-[1.8]" />
            </span>
            <span className="flex flex-col gap-1.5 text-left">
              <span className={`text-[17px] font-semibold ${card.titleColor}`}>{card.title}</span>
              <span className="text-[14px] leading-5 text-brand-slate max-w-[330px]">{card.description}</span>
            </span>
          </>
        );

        return card.to ? (
          <Link key={card.title} to={card.to} className={`min-h-[188px] rounded-xl border border-brand-border p-5 flex items-center gap-4 transition-transform hover:-translate-y-0.5 ${card.surface}`}>
            {content}
          </Link>
        ) : (
          <div key={card.title} aria-disabled="true" className={`min-h-[188px] rounded-xl border border-brand-border p-5 flex items-center gap-4 ${card.surface}`}>
            {content}
          </div>
        );
      })}
    </div>
  </div>
);
