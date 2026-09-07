'use client';

import { useState, type ReactNode } from 'react';
import { Tabs, TabList, Tab, TabPanel } from '@/components/ui/tabs';

export function CustomerTabs({
  overviewLabel,
  repairsLabel,
  devicesLabel,
  invoicesLabel,
  repairsCount,
  devicesCount,
  overview,
  repairs,
  devices,
  invoices,
}: {
  overviewLabel: string;
  repairsLabel: string;
  devicesLabel: string;
  invoicesLabel: string;
  repairsCount: number;
  devicesCount: number;
  overview: ReactNode;
  repairs: ReactNode;
  devices: ReactNode;
  invoices: ReactNode;
}) {
  const [tab, setTab] = useState('overview');

  return (
    <Tabs value={tab} onChange={setTab}>
      <div className="px-4 pt-4">
        <TabList>
          <Tab value="overview">{overviewLabel}</Tab>
          <Tab value="repairs" badge={repairsCount}>
            {repairsLabel}
          </Tab>
          <Tab value="devices" badge={devicesCount}>
            {devicesLabel}
          </Tab>
          <Tab value="invoices">{invoicesLabel}</Tab>
        </TabList>
      </div>
      <TabPanel value="overview">{overview}</TabPanel>
      <TabPanel value="repairs">{repairs}</TabPanel>
      <TabPanel value="devices">{devices}</TabPanel>
      <TabPanel value="invoices">{invoices}</TabPanel>
    </Tabs>
  );
}
