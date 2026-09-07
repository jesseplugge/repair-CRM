'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { deleteRepair } from '@/lib/actions/repairs';
import { Button } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { Trash2 } from 'lucide-react';

export function DeleteRepairButton({ repairId }: { repairId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations('repairDetail');
  const tCommon = useTranslations('common');
  const tSub = useTranslations('repairSub');
  const toast = useToast();

  function confirmDelete() {
    startTransition(async () => {
      const result = await deleteRepair(repairId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      toast({ variant: 'success', title: t('repairDeleted') });
      router.push('/reparaties');
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="focus-ring flex items-center gap-1.5 rounded px-2 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
      >
        <Trash2 size={15} /> {t('deleteRepair')}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('deleteConfirmTitle')}
        footer={
          <>
            <Button variant="ghost" disabled={pending} onClick={() => setOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button variant="danger" disabled={pending} onClick={confirmDelete}>
              {pending ? tSub('busy') : t('deleteRepair')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-600">{t('deleteConfirmBody')}</p>
        {error && <p className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </Modal>
    </>
  );
}
