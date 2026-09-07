'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { updateRepairStatus } from '@/lib/actions/repairs';
import { StatusTimeline } from '@/components/ui/status-timeline';
import { Button } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';

type Status = { id: string; name: string; color: string | null };

export function StatusChanger({
  repairId,
  currentStatusId,
  statuses,
}: {
  repairId: string;
  currentStatusId: string;
  statuses: Status[];
}) {
  const [value, setValue] = useState(currentStatusId);
  const [pendingStatusId, setPendingStatusId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations('repairSub');
  const tCommon = useTranslations('common');
  const toast = useToast();

  const pendingStatus = statuses.find((s) => s.id === pendingStatusId);

  function confirm() {
    if (!pendingStatusId) return;
    const newStatusId = pendingStatusId;
    setValue(newStatusId);
    setPendingStatusId(null);
    startTransition(async () => {
      await updateRepairStatus(repairId, newStatusId);
      toast({ variant: 'success', title: t('statusUpdated') });
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <StatusTimeline
        statuses={statuses}
        currentStatusId={value}
        disabled={pending}
        onSelect={(id) => setPendingStatusId(id)}
      />

      {pendingStatus && (
        <div className="space-y-2 rounded border border-ink-200 bg-ink-50 p-2.5">
          <p className="text-xs text-ink-600">{t('confirmStatusChange', { status: pendingStatus.name })}</p>
          <div className="flex gap-2">
            <Button variant="primary" size="md" className="flex-1" disabled={pending} onClick={confirm}>
              {pending ? t('busy') : tCommon('confirm')}
            </Button>
            <Button variant="ghost" size="md" disabled={pending} onClick={() => setPendingStatusId(null)}>
              {t('cancel')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
