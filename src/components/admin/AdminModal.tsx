import React, { useEffect, useId, useRef } from 'react';

interface AdminModalProps {
  title: string;
  description: string;
  children?: React.ReactNode;
  confirmLabel: string;
  isSubmitting?: boolean;
  confirmDisabled?: boolean;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  title,
  description,
  children,
  confirmLabel,
  isSubmitting = false,
  confirmDisabled = false,
  danger = false,
  onCancel,
  onConfirm,
}) => {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const latest = useRef({ isSubmitting, onCancel });
  latest.current = { isSubmitting, onCancel };

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const firstInput = dialogRef.current?.querySelector<HTMLInputElement>('input');
    (firstInput || cancelRef.current)?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !latest.current.isSubmitting) latest.current.onCancel();
      if (event.key !== 'Tab') return;
      const elements = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]') || []);
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first) { event.preventDefault(); dialogRef.current?.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || !elements.includes(document.activeElement as HTMLElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !elements.includes(document.activeElement as HTMLElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-brand-ink/30 px-4 flex items-center justify-center" role="presentation" onMouseDown={(e) => { if (e.currentTarget === e.target && !isSubmitting) onCancel(); }}>
      <section ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} aria-busy={isSubmitting} className="w-full max-w-[530px] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[12px] border border-brand-border bg-white p-7 shadow-xl">
        <form onSubmit={(event) => { event.preventDefault(); if (!isSubmitting && !confirmDisabled) onConfirm(); }}>
        <h2 id={titleId} className="font-serif text-[25px] leading-[36px] font-medium text-brand-ink">{title}</h2>
        <p id={descriptionId} className="mt-4 text-[14px] leading-[1.45] text-brand-slate">{description}</p>
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-4 flex justify-end gap-2.5">
          <button ref={cancelRef} type="button" disabled={isSubmitting} onClick={onCancel} className="h-10 min-w-[88px] px-5 rounded-md border border-brand-border text-[13px] font-semibold text-brand-teal disabled:opacity-60">Cancel</button>
          <button type="submit" disabled={isSubmitting || confirmDisabled} className={`h-10 min-w-[148px] px-5 rounded-md text-[13px] font-semibold text-white disabled:opacity-60 ${danger ? 'bg-[#A1372B] hover:bg-[#842D23]' : 'bg-brand-teal hover:bg-brand-tealHover'}`}>{isSubmitting ? 'Please wait…' : confirmLabel}</button>
        </div>
        </form>
      </section>
    </div>
  );
};
