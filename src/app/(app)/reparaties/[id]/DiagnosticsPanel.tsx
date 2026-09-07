'use client';

import { useState, useTransition } from 'react';
import { setDiagnosticResult } from '@/lib/actions/diagnostics';

type Result = 'pass' | 'fail' | 'not_tested' | 'na';

const RESULT_META: Record<Result, { label: string; dot: string }> = {
  pass: { label: 'OK', dot: '#2F8F5B' },
  fail: { label: 'Fout', dot: '#C4453A' },
  not_tested: { label: 'Niet getest', dot: '#C97A22' },
  na: { label: 'N.v.t.', dot: '#8A93A6' },
};

function ResultSelect({ value, onChange, disabled }: { value: Result; onChange: (v: Result) => void; disabled?: boolean }) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as Result)}
      className="w-full rounded border border-ink-200 bg-white px-2 py-1 text-xs"
      style={{ color: RESULT_META[value].dot }}
    >
      {(Object.keys(RESULT_META) as Result[]).map((r) => (
        <option key={r} value={r}>
          {RESULT_META[r].label}
        </option>
      ))}
    </select>
  );
}

export function DiagnosticsPanel({
  repairId,
  items,
  initial,
}: {
  repairId: string;
  items: string[];
  initial: Record<string, { pre: Result; post: Result }>;
}) {
  const [values, setValues] = useState(initial);
  const [pending, startTransition] = useTransition();

  function update(item: string, stage: 'pre' | 'post', result: Result) {
    setValues((v) => ({ ...v, [item]: { ...v[item], [stage]: result } }));
    startTransition(async () => {
      await setDiagnosticResult(repairId, stage, item, result);
    });
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-ink-400">
        Geen diagnoseprofiel ingesteld. Voeg er een toe via Instellingen.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[1fr_120px_120px] gap-2 px-1 pb-1 text-xs font-medium uppercase tracking-wide text-ink-400">
        <span>Onderdeel</span>
        <span>Voor reparatie</span>
        <span>Na reparatie</span>
      </div>
      {items.map((item) => {
        const v = values[item] ?? { pre: 'not_tested', post: 'not_tested' };
        return (
          <div key={item} className="grid grid-cols-[1fr_120px_120px] items-center gap-2 rounded px-1 py-1 text-sm hover:bg-ink-50">
            <span className="text-ink-700">{item}</span>
            <ResultSelect value={v.pre} disabled={pending} onChange={(r) => update(item, 'pre', r)} />
            <ResultSelect value={v.post} disabled={pending} onChange={(r) => update(item, 'post', r)} />
          </div>
        );
      })}
    </div>
  );
}
