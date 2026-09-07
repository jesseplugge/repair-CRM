'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { removeRepairItem } from '@/lib/actions/repairs';
import { useToast } from '@/components/ui/toast';

export function RemoveItemButton({ repairId, itemId }: { repairId: string; itemId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations('repairSub');
  const toast = useToast();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await removeRepairItem(repairId, itemId);
          toast({ variant: 'success', title: t('itemRemoved') });
          router.refresh();
        })
      }
      className="focus-ring text-ink-300 hover:text-danger-600 disabled:opacity-50"
      title={t('remove')}
    >
      <X size={15} />
    </button>
  );
}
