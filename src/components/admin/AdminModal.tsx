import React, { useEffect, useRef } from 'react';

interface AdminModalProps {
  title: string;
  description: string;
  children?: React.ReactNode;
  confirmLabel: string;
  isSubmitting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  title,
  description,
  children,
  confirmLabel,
  isSubmitting = false,
  onCancel,
  onConfirm,
}) => {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) onCancel();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isSubmitting, onCancel]);

  return (
    <div className="fixed inset-0 z-50 bg-brand-ink/30 px-4 flex items-center justify-center" role="presentation" onMouseDown={(e) => { if (e.currentTarget === e.target && !isSubmitting) onCancel(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="admin-modal-title" className="w-full max-w-[530px] rounded-[12px] border border-brand-border bg-white p-7 shadow-xl">
        <h2 id="admin-modal-title" className="font-serif text-[27px] leading-[36px] font-medium text-brand-ink">{title}</h2>
        <p className="mt-3 text-[14px] leading-[22px] text-brand-slate">{description}</p>
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-6 flex justify-end gap-3">
          <button ref={cancelRef} type="button" disabled={isSubmitting} onClick={onCancel} className="h-10 min-w-[88px] px-5 rounded-md border border-brand-border text-[13px] font-semibold text-brand-teal disabled:opacity-60">Cancel</button>
          <button type="button" disabled={isSubmitting} onClick={onConfirm} className="h-10 min-w-[148px] px-5 rounded-md bg-brand-teal hover:bg-brand-tealHover text-[13px] font-semibold text-white disabled:opacity-60">{isSubmitting ? 'Saving…' : confirmLabel}</button>
        </div>
      </section>
    </div>
  );
};
