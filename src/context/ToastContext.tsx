import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'success') => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((prev) => [...prev, { id, message, type }]);
      window.setTimeout(() => {
        dismissToast(id);
      }, 4000);
    },
    [dismissToast],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-16 right-5 z-[60] flex flex-col gap-2.5 max-w-[380px] w-[calc(100vw-2.5rem)] pointer-events-none"
      >
        {toasts.map((toast) => {
          const styles =
            toast.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-900'
              : toast.type === 'info'
                ? 'border-brand-border bg-white text-brand-ink'
                : 'border-brand-teal/30 bg-[#EDF7F4] text-brand-teal';
          const Icon =
            toast.type === 'error'
              ? XCircle
              : toast.type === 'info'
                ? Info
                : CheckCircle2;

          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto rounded-lg border px-4 py-3 shadow-lg flex items-start gap-3 text-[13px] font-medium ${styles}`}
            >
              <Icon className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="flex-1 leading-snug">{toast.message}</span>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => dismissToast(toast.id)}
                className="shrink-0 opacity-70 hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
