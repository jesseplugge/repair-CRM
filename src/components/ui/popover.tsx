'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { clsx } from 'clsx';

type TriggerProps = {
  onClick: () => void;
  'aria-expanded': boolean;
  'aria-haspopup': 'menu' | 'dialog';
  ref: (el: HTMLElement | null) => void;
};

/**
 * Trigger + floating panel, extracted from the duplicated NotificationsBell/LanguageSwitcher
 * pattern: a `fixed inset-0` click-catcher plus an absolutely-positioned panel. The trigger is
 * a render prop so callers keep full control of the trigger's appearance.
 */
export function Popover({
  trigger,
  children,
  align = 'right',
  width = 'w-80',
  role = 'menu',
}: {
  trigger: (props: TriggerProps) => ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  align?: 'left' | 'right';
  width?: string;
  role?: 'menu' | 'dialog';
}) {
  const [open, setOpen] = useState(false);
  const triggerElRef = useRef<HTMLElement | null>(null);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerElRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return (
    <div className="relative">
      {trigger({
        onClick: () => setOpen((v) => !v),
        'aria-expanded': open,
        'aria-haspopup': role,
        ref: (el) => {
          triggerElRef.current = el;
        },
      })}

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={close} />
          <div
            role={role}
            className={clsx(
              // max-w guards against the panel overflowing a narrow phone
              // viewport regardless of how wide `width` asks for — a fixed
              // w-80 etc. is fine on desktop but can force page-level
              // horizontal scroll on a ~360px-wide screen otherwise.
              'absolute z-50 mt-2 max-w-[calc(100vw-2rem)] animate-scale-in rounded-lg border border-ink-200 bg-white shadow-elevated',
              align === 'right' ? 'right-0' : 'left-0',
              width
            )}
          >
            {typeof children === 'function' ? children(close) : children}
          </div>
        </>
      )}
    </div>
  );
}

export function DropdownMenuItem({
  onClick,
  children,
  active = false,
}: {
  onClick: () => void;
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={clsx(
        'focus-ring flex w-full items-center px-3 py-1.5 text-left text-sm hover:bg-ink-50',
        active ? 'font-semibold text-[var(--accent)]' : 'text-ink-700'
      )}
    >
      {children}
    </button>
  );
}
