'use client';

import { useState, type ReactNode } from 'react';
import { clsx } from 'clsx';

type Category = { key: string; label: string; content: ReactNode };

export function SettingsShell({ categories }: { categories: Category[] }) {
  const [active, setActive] = useState(categories[0]?.key);
  const current = categories.find((c) => c.key === active) ?? categories[0];

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-8">
      {/* Fixed-width sidebar nav on desktop; a horizontally-scrollable pill
          row on phone widths instead — a plain w-48 shrink-0 sidebar with no
          breakpoint never fit a phone screen at all. */}
      <nav className="flex gap-2 overflow-x-auto pb-1 lg:w-48 lg:shrink-0 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0">
        {categories.map((c) => (
          <button
            key={c.key}
            onClick={() => setActive(c.key)}
            className={clsx(
              'focus-ring shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-left text-sm font-medium transition-colors lg:w-full lg:whitespace-normal lg:rounded',
              active === c.key ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
            )}
          >
            {c.label}
          </button>
        ))}
      </nav>
      <div className="min-w-0 max-w-2xl flex-1">{current?.content}</div>
    </div>
  );
}
