import React from 'react';
import { LucideIcon } from 'lucide-react';

interface AdminPageHeaderProps {
  breadcrumb: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  iconClassName?: string;
  action?: React.ReactNode;
}

export const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({
  breadcrumb,
  title,
  description,
  icon: Icon,
  iconClassName = 'bg-[#2E8B57]',
  action,
}) => {
  const today = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <>
      <div className="pt-[25px] flex items-center justify-between text-[12px] text-brand-slate">
        <span>{breadcrumb}</span>
        <span className="hidden sm:inline">{today}</span>
      </div>
      <div className="mt-[17px] min-h-[73px] flex items-center justify-between gap-6">
        <div className="flex items-center gap-5 min-w-0">
          {Icon && (
            <span className={`w-12 h-12 rounded-[11px] text-white flex items-center justify-center shrink-0 ${iconClassName}`}>
              <Icon className="w-[23px] h-[23px] stroke-[1.8]" />
            </span>
          )}
          <div className="min-w-0">
            <h1 className="font-serif text-[30px] leading-[44px] font-medium text-brand-ink">{title}</h1>
            <p className="text-[14px] leading-5 text-brand-slate">{description}</p>
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </>
  );
};
