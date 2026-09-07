'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Input } from '@/components/ui/primitives';

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

const PRESET_KEYS = {
  today: 'presetToday',
  week: 'presetWeek',
  month: 'presetMonth',
  quarter: 'presetQuarter',
  year: 'presetYear',
} as const;

export function DateRangeFilter({ from, to }: { from: string; to: string }) {
  const router = useRouter();
  const [fromVal, setFromVal] = useState(from);
  const [toVal, setToVal] = useState(to);
  const t = useTranslations('reportsPage');

  function apply(f: string, tt: string) {
    router.push(`/rapportages?from=${f}&to=${tt}`);
  }

  function preset(kind: 'today' | 'week' | 'month' | 'quarter' | 'year') {
    const now = new Date();
    let start = new Date();
    if (kind === 'today') start = now;
    if (kind === 'week') start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
    if (kind === 'month') start = new Date(now.getFullYear(), now.getMonth(), 1);
    if (kind === 'quarter') start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    if (kind === 'year') start = new Date(now.getFullYear(), 0, 1);
    apply(iso(start), iso(now));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {(['today', 'week', 'month', 'quarter', 'year'] as const).map((k) => (
        <Button key={k} variant="secondary" onClick={() => preset(k)}>
          {t(PRESET_KEYS[k])}
        </Button>
      ))}
      <Input type="date" value={fromVal} onChange={(e) => setFromVal(e.target.value)} className="w-auto" />
      <span className="text-ink-400">{t('through')}</span>
      <Input type="date" value={toVal} onChange={(e) => setToVal(e.target.value)} className="w-auto" />
      <Button variant="primary" onClick={() => apply(fromVal, toVal)}>
        {t('apply')}
      </Button>
    </div>
  );
}
