'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';

type ToastVariant = 'success' | 'error' | 'info';

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  action?: { label: string; onClick: () => void };
  /** ms before auto-dismiss; set 0 to require manual dismiss. */
  duration?: number;
};

type ToastItem = ToastInput & { id: number };

type ToastContextValue = (input: ToastInput) => void;

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((items) => items.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback<ToastContextValue>((input) => {
    const id = ++idRef.current;
    setToasts((items) => [...items, { ...input, id }]);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

const VARIANT_ICON: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const VARIANT_ICON_CLASS: Record<ToastVariant, string> = {
  success: 'text-success-600',
  error: 'text-danger-600',
  info: 'text-[var(--accent)]',
};

function Toaster({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-full max-w-sm flex-col gap-2"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const variant = toast.variant ?? 'info';
  const Icon = VARIANT_ICON[variant];
  const duration = toast.duration ?? DEFAULT_DURATION;
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  function scheduleDismiss() {
    if (duration <= 0) return;
    timerRef.current = setTimeout(onDismiss, duration);
  }
  function cancelDismiss() {
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  useEffect(() => {
    scheduleDismiss();
    return cancelDismiss;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      onMouseEnter={cancelDismiss}
      onMouseLeave={scheduleDismiss}
      className="pointer-events-auto flex items-start gap-2.5 rounded-lg border border-ink-200 bg-white px-4 py-3 shadow-elevated animate-fade-in"
    >
      <Icon size={18} className={clsx('mt-0.5 shrink-0', VARIANT_ICON_CLASS[variant])} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink-900">{toast.title}</p>
        {toast.description && <p className="mt-0.5 text-xs text-ink-500">{toast.description}</p>}
        {toast.action && (
          <button
            onClick={() => {
              toast.action?.onClick();
              onDismiss();
            }}
            className="focus-ring mt-1.5 text-xs font-semibold text-[var(--accent)] hover:underline"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button onClick={onDismiss} className="focus-ring shrink-0 rounded p-0.5 text-ink-300 hover:text-ink-600" aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  );
}
