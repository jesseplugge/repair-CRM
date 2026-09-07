'use client';

import { useState, type ReactNode } from 'react';
import { clsx } from 'clsx';

type Category = { key: string; label: string; content: ReactNode };

export function SettingsShell({ categories }: { categories: Category[] }) {
  const [active, setActive] = useState(categories[0]?.key);
  const current = categories.find((c) => c.key === active) ?? categories[0];

  return (
    <div className="flex gap-8">
      <nav className="w-48 shrink-0 space-y-0.5">
        {categories.map((c) => (
          <button
            key={c.key}
            onClick={() => setActive(c.key)}
            className={clsx(
              'focus-ring block w-full rounded px-3 py-2 text-left text-sm font-medium transition-colors',
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
