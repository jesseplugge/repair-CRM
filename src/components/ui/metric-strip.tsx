export function MetricStrip({ items }: { items: { label: string; value: string | number; hint?: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-0 sm:divide-x sm:divide-ink-100 sm:rounded-lg sm:border sm:border-ink-100 sm:bg-white sm:shadow-card">
      {items.map((item, i) => (
        <div
          key={i}
          className="rounded-lg border border-ink-100 bg-white px-4 py-3 shadow-card sm:min-w-[7rem] sm:flex-1 sm:rounded-none sm:border-0 sm:shadow-none"
          title={item.hint}
        >
          <div className="font-display text-xl font-semibold tabular-nums text-ink-950">{item.value}</div>
          <div className="mt-0.5 text-xs text-ink-500">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
