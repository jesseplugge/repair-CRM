import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { clsx } from 'clsx';

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('overflow-x-auto', className)}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function Thead({ children }: { children: ReactNode }) {
  return <thead className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400">{children}</thead>;
}

export function Tbody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-ink-100">{children}</tbody>;
}

export function Tr({ children, className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={clsx('transition-colors hover:bg-ink-50', className)} {...props}>
      {children}
    </tr>
  );
}

type ThProps = ThHTMLAttributes<HTMLTableCellElement> & {
  align?: 'left' | 'right';
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
};

export function Th({ children, align = 'left', sortable, sortDirection, onSort, className, ...props }: ThProps) {
  if (!sortable) {
    return (
      <th className={clsx('px-4 py-3 font-medium', align === 'right' && 'text-right', className)} {...props}>
        {children}
      </th>
    );
  }
  const Icon = sortDirection === 'asc' ? ChevronUp : sortDirection === 'desc' ? ChevronDown : ChevronsUpDown;
  return (
    <th className={clsx('px-4 py-3 font-medium', align === 'right' && 'text-right', className)} {...props}>
      <button
        type="button"
        onClick={onSort}
        className={clsx(
          'focus-ring inline-flex items-center gap-1 rounded hover:text-ink-700',
          align === 'right' && 'flex-row-reverse'
        )}
      >
        {children}
        <Icon size={12} className={sortDirection ? 'text-ink-600' : 'text-ink-300'} />
      </button>
    </th>
  );
}

export function Td({ children, align = 'left', className, ...props }: TdHTMLAttributes<HTMLTableCellElement> & { align?: 'left' | 'right' }) {
  return (
    <td className={clsx('px-4 py-3', align === 'right' && 'text-right', className)} {...props}>
      {children}
    </td>
  );
}
