import { clsx } from 'clsx';

/**
 * One stat tile in the committed indigo-violet palette — used wherever a page leads with a
 * few numbers (dashboard, reports, a customer's record). `emphasize` puts it on the dark
 * brand surface for the figure that calls for a hand now; the rest sit on its soft tint.
 */
export function KpiTile({
  label,
  value,
  hint,
  emphasize = false,
}: {
  label: string;
  value: string | number;
  hint?: string;
  emphasize?: boolean;
}) {
  return (
    <div className={clsx('rounded-lg px-4 py-3.5', emphasize ? 'bg-mat' : 'bg-signal-100')} title={hint}>
      <div className={clsx('font-mono text-2xl font-bold tabular-nums', emphasize ? 'text-white' : 'text-ink-950')}>{value}</div>
      <div className={clsx('mt-1 text-xs font-medium', emphasize ? 'text-signal-100' : 'text-ink-600')}>{label}</div>
    </div>
  );
}

/** A row of KpiTiles — the shared layout for a page's lead stats. */
export function KpiStrip({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{children}</div>;
}
