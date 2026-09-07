export function MetricStrip({ items }: { items: { label: string; value: string | number }[] }) {
  return (
    <div className="flex divide-x divide-ink-100 overflow-x-auto rounded-lg border border-ink-100 bg-white shadow-card">
      {items.map((item, i) => (
        <div key={i} className="min-w-[7rem] flex-1 px-4 py-3">
          <div className="font-display text-xl font-semibold tabular-nums text-ink-950">{item.value}</div>
          <div className="mt-0.5 text-xs text-ink-500">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
