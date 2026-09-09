'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { setDiagnosticResult } from '@/lib/actions/diagnostics';
import { ChevronDown, ChevronRight } from 'lucide-react';

type Result = 'pass' | 'fail' | 'not_tested' | 'na';

const RESULT_DOTS: Record<Result, string> = {
  pass: '#2F8F5B',
  fail: '#C4453A',
  not_tested: '#C97A22',
  na: '#8A93A6',
};
const RESULT_KEYS: Record<Result, string> = {
  pass: 'resultPass',
  fail: 'resultFail',
  not_tested: 'resultNotTested',
  na: 'resultNa',
};

function ResultSelect({
  value,
  onChange,
  disabled,
  t,
}: {
  value: Result;
  onChange: (v: Result) => void;
  disabled?: boolean;
  t: ReturnType<typeof useTranslations<'repairTabs'>>;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as Result)}
      className="w-full rounded border border-ink-200 bg-white px-2 py-1 text-xs"
      style={{ color: RESULT_DOTS[value] }}
    >
      {(Object.keys(RESULT_DOTS) as Result[]).map((r) => (
        <option key={r} value={r}>
          {t(RESULT_KEYS[r] as any)}
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
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const t = useTranslations('repairTabs');

  function update(item: string, stage: 'pre' | 'post', result: Result) {
    setValues((v) => ({ ...v, [item]: { ...v[item], [stage]: result } }));
    startTransition(async () => {
      await setDiagnosticResult(repairId, stage, item, result);
    });
  }

  if (items.length === 0) {
    return <p className="text-sm text-ink-400">{t('noDiagnosticProfile')}</p>;
  }

  const testedCount = items.filter((item) => (values[item] ?? { pre: 'not_tested' }).pre !== 'not_tested').length;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="focus-ring flex w-full items-center gap-2 rounded px-1 py-1.5 text-left text-sm font-medium text-ink-900 hover:bg-ink-50"
        aria-expanded={open}
      >
        {open ? <ChevronDown size={15} className="text-ink-400" /> : <ChevronRight size={15} className="text-ink-400" />}
        {t('diagnostics')}
        <span className="text-xs font-normal text-ink-400">{t('testedCount', { tested: testedCount, total: items.length })}</span>
      </button>

      {open && (
        <div className="mt-2 space-y-1">
          <div className="grid grid-cols-[1fr_80px_80px] sm:grid-cols-[1fr_120px_120px] gap-2 px-1 pb-1 text-xs font-medium uppercase tracking-wide text-ink-400">
            <span>{t('component')}</span>
            <span>{t('beforeRepair')}</span>
            <span>{t('afterRepair')}</span>
          </div>
          {items.map((item) => {
            const v = values[item] ?? { pre: 'not_tested', post: 'not_tested' };
            return (
              <div key={item} className="grid grid-cols-[1fr_80px_80px] sm:grid-cols-[1fr_120px_120px] items-center gap-2 rounded px-1 py-1 text-sm hover:bg-ink-50">
                <span className="text-ink-700">{item}</span>
                <ResultSelect value={v.pre} disabled={pending} onChange={(r) => update(item, 'pre', r)} t={t} />
                <ResultSelect value={v.post} disabled={pending} onChange={(r) => update(item, 'post', r)} t={t} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
