'use client';

import { useTranslations } from 'next-intl';
import { deleteWarrantyClaim } from '@/lib/actions/warranty';
import { ConfirmDeleteButton } from '@/components/ui/confirm-delete-button';

export function DeleteClaimButton({ claimId, repairId, claimNumber }: { claimId: string; repairId: string; claimNumber: string }) {
  const t = useTranslations('repairTabs');
  return (
    <ConfirmDeleteButton
      title={t('deleteClaimConfirmTitle')}
      body={t('deleteClaimConfirmBody', { claimNumber })}
      onConfirm={() => deleteWarrantyClaim(claimId, repairId)}
    />
  );
}
