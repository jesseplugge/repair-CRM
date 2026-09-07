'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/primitives';
import { Tabs, TabList, Tab, TabPanel } from '@/components/ui/tabs';
import { DiagnosticsPanel } from './DiagnosticsPanel';
import { PhotosPanel } from './PhotosPanel';
import { WarrantyPanel, type WarrantyClaim } from './WarrantyPanel';

type Result = 'pass' | 'fail' | 'not_tested' | 'na';

export function RepairExtraTabs({
  repairId,
  diagnosticItems,
  diagnosticResults,
  photos,
  claims,
  activityContent,
}: {
  repairId: string;
  diagnosticItems: string[];
  diagnosticResults: Record<string, { pre: Result; post: Result }>;
  photos: { id: string; url: string; label: string | null }[];
  claims: WarrantyClaim[];
  activityContent: ReactNode;
}) {
  const [tab, setTab] = useState('diagnostics');
  const t = useTranslations('repairTabs');

  return (
    <Card className="p-4">
      <Tabs value={tab} onChange={setTab}>
        <TabList>
          <Tab value="diagnostics">{t('diagnostics')}</Tab>
          <Tab value="photos" badge={photos.length}>
            {t('photos')}
          </Tab>
          <Tab value="warranty" badge={claims.length}>
            {t('warranty')}
          </Tab>
          <Tab value="activity">{t('activity')}</Tab>
        </TabList>

        <TabPanel value="diagnostics">
          <DiagnosticsPanel repairId={repairId} items={diagnosticItems} initial={diagnosticResults} />
        </TabPanel>
        <TabPanel value="photos">
          <PhotosPanel repairId={repairId} photos={photos} />
        </TabPanel>
        <TabPanel value="warranty">
          <WarrantyPanel repairId={repairId} claims={claims} />
        </TabPanel>
        <TabPanel value="activity">{activityContent}</TabPanel>
      </Tabs>
    </Card>
  );
}
