'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/primitives';
import { DiagnosticsPanel } from './DiagnosticsPanel';
import { PhotosPanel } from './PhotosPanel';
import { WarrantyPanel, type WarrantyClaim } from './WarrantyPanel';

type Result = 'pass' | 'fail' | 'not_tested' | 'na';

const TABS = ['diagnostics', 'photos', 'warranty'] as const;
type Tab = (typeof TABS)[number];

export function RepairExtraTabs({
  repairId,
  diagnosticItems,
  diagnosticResults,
  photos,
  claims,
}: {
  repairId: string;
  diagnosticItems: string[];
  diagnosticResults: Record<string, { pre: Result; post: Result }>;
  photos: { id: string; url: string; label: string | null }[];
  claims: WarrantyClaim[];
}) {
  const [tab, setTab] = useState<Tab>('diagnostics');
  const t = useTranslations('repairTabs');

  return (
    <Card className="p-4">
      <div className="mb-4 flex gap-1 border-b border-ink-100">
        {TABS.map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              tab === tabKey ? 'border-b-2 border-[var(--accent)] text-[var(--accent)]' : 'text-ink-500 hover:text-ink-800'
            }`}
          >
            {t(tabKey)}
            {tabKey === 'photos' && photos.length > 0 && <span className="ml-1 text-ink-400">({photos.length})</span>}
            {tabKey === 'warranty' && claims.length > 0 && <span className="ml-1 text-ink-400">({claims.length})</span>}
          </button>
        ))}
      </div>

      {tab === 'diagnostics' && <DiagnosticsPanel repairId={repairId} items={diagnosticItems} initial={diagnosticResults} />}
      {tab === 'photos' && <PhotosPanel repairId={repairId} photos={photos} />}
      {tab === 'warranty' && <WarrantyPanel repairId={repairId} claims={claims} />}
    </Card>
  );
}
