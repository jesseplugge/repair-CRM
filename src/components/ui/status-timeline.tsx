'use client';

import { Check } from 'lucide-react';
import { clsx } from 'clsx';

type Status = { id: string; name: string; color?: string | null };

/**
 * Vertical progress stepper over a business's own configured status list — statuses are
 * fully data-driven per business, so this never assumes a fixed English progression.
 * Steps before the current one render as done, the current one as active, the rest as upcoming.
 */
export function StatusTimeline({
  statuses,
  currentStatusId,
  onSelect,
  disabled,
}: {
  statuses: Status[];
  currentStatusId: string;
  onSelect?: (statusId: string) => void;
  disabled?: boolean;
}) {
  const currentIndex = statuses.findIndex((s) => s.id === currentStatusId);

  return (
    <ol className="space-y-0">
      {statuses.map((status, index) => {
        const isDone = currentIndex >= 0 && index < currentIndex;
        const isCurrent = status.id === currentStatusId;
        const isLast = index === statuses.length - 1;
        const clickable = Boolean(onSelect) && !isCurrent && !disabled;

        const content = (
          <div className="flex items-center gap-2.5 py-1.5">
            <span
              className={clsx(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold',
                isDone && 'border-[var(--accent)] bg-[var(--accent)] text-white',
                isCurrent && 'border-[var(--accent)] bg-white text-[var(--accent)]',
                !isDone && !isCurrent && 'border-ink-200 bg-white text-ink-300'
              )}
            >
              {isDone ? <Check size={12} strokeWidth={3} /> : isCurrent ? <span className="h-2 w-2 rounded-full bg-[var(--accent)]" /> : null}
            </span>
            <span className={clsx('text-sm', isCurrent ? 'font-semibold text-ink-950' : isDone ? 'text-ink-700' : 'text-ink-400')}>
              {status.name}
            </span>
          </div>
        );

        return (
          <li key={status.id} className="relative">
            {!isLast && (
              <span
                className={clsx('absolute left-[9px] top-7 h-[calc(100%-1.25rem)] w-px', isDone ? 'bg-[var(--accent)]' : 'bg-ink-200')}
                aria-hidden
              />
            )}
            {clickable ? (
              <button type="button" onClick={() => onSelect?.(status.id)} className="focus-ring w-full rounded text-left">
                {content}
              </button>
            ) : (
              content
            )}
          </li>
        );
      })}
    </ol>
  );
}
