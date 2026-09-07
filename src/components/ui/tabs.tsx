'use client';

import { createContext, useContext, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { clsx } from 'clsx';

type TabsContextValue = { value: string; setValue: (v: string) => void };
const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs.* must be used within <Tabs>');
  return ctx;
}

export function Tabs({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: ReactNode }) {
  return <TabsContext.Provider value={{ value, setValue: onChange }}>{children}</TabsContext.Provider>;
}

export function TabList({ children }: { children: ReactNode }) {
  const listRef = useRef<HTMLDivElement>(null);

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const tabs = listRef.current?.querySelectorAll<HTMLElement>('[role="tab"]');
    if (!tabs || tabs.length === 0) return;
    const items = Array.from(tabs);
    const currentIndex = items.findIndex((el) => el === document.activeElement);
    if (currentIndex === -1) return;
    e.preventDefault();
    const delta = e.key === 'ArrowRight' ? 1 : -1;
    const next = items[(currentIndex + delta + items.length) % items.length];
    next.focus();
    next.click();
  }

  return (
    <div ref={listRef} role="tablist" onKeyDown={handleKeyDown} className="mb-4 flex gap-1 border-b border-ink-100">
      {children}
    </div>
  );
}

export function Tab({ value, children, badge }: { value: string; children: ReactNode; badge?: number }) {
  const { value: active, setValue } = useTabsContext();
  const selected = active === value;
  return (
    <button
      role="tab"
      aria-selected={selected}
      tabIndex={selected ? 0 : -1}
      onClick={() => setValue(value)}
      className={clsx(
        'focus-ring px-3 py-2 text-sm font-medium transition-colors',
        selected ? 'border-b-2 border-[var(--accent)] text-[var(--accent)]' : 'text-ink-500 hover:text-ink-800'
      )}
    >
      {children}
      {typeof badge === 'number' && badge > 0 && <span className="ml-1 text-ink-400">({badge})</span>}
    </button>
  );
}

export function TabPanel({ value, children }: { value: string; children: ReactNode }) {
  const { value: active } = useTabsContext();
  if (active !== value) return null;
  return <div role="tabpanel">{children}</div>;
}
