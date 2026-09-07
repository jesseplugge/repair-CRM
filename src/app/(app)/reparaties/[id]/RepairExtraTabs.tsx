'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/primitives';
import { DiagnosticsPanel } from './DiagnosticsPanel';
import { PhotosPanel } from './PhotosPanel';
import { WarrantyPanel, type WarrantyClaim } from './WarrantyPanel';

type Result = 'pass' | 'fail' | 'not_tested' | 'na';

const TABS = ['diagnostics', 'photos', 'warranty'] as const;
type Tab = (typeof TABS)[number];
const TAB_LABELS: Record<Tab, string> = {
  diagnostics: 'Diagnose',
  photos: "Foto's",
  warranty: 'Garantie',
};

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

  return (
    <Card className="p-4">
      <div className="mb-4 flex gap-1 border-b border-ink-100">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              tab === t ? 'border-b-2 border-[var(--accent)] text-[var(--accent)]' : 'text-ink-500 hover:text-ink-800'
            }`}
          >
            {TAB_LABELS[t]}
            {t === 'photos' && photos.length > 0 && <span className="ml-1 text-ink-400">({photos.length})</span>}
            {t === 'warranty' && claims.length > 0 && <span className="ml-1 text-ink-400">({claims.length})</span>}
          </button>
        ))}
      </div>

      {tab === 'diagnostics' && <DiagnosticsPanel repairId={repairId} items={diagnosticItems} initial={diagnosticResults} />}
      {tab === 'photos' && <PhotosPanel repairId={repairId} photos={photos} />}
      {tab === 'warranty' && <WarrantyPanel repairId={repairId} claims={claims} />}
    </Card>
  );
}
