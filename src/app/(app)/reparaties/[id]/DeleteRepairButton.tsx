'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { deleteRepair } from '@/lib/actions/repairs';
import { Button } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { Trash2 } from 'lucide-react';

/**
 * redirectTo: where to navigate after a successful delete (e.g. back to the list from a
 * repair's own detail page). Omit it to stay put and just refresh — the list page passes
 * nothing so a deleted row simply drops out of its own table instead of bouncing you away.
 */
export function DeleteRepairButton({ repairId, redirectTo, compact = false }: { repairId: string; redirectTo?: string; compact?: boolean }) {
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
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    });
  }

  return (
    <>
      {compact ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setError(null);
            setOpen(true);
          }}
          className="focus-ring text-ink-300 hover:text-danger-600"
          title={t('deleteRepair')}
        >
          <Trash2 size={14} />
        </button>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setError(null);
            setOpen(true);
          }}
          className="focus-ring flex items-center gap-1.5 rounded px-2 py-1.5 text-sm font-medium text-danger-600 hover:bg-danger-50"
        >
          <Trash2 size={15} /> {t('deleteRepair')}
        </button>
      )}

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
        {error && <p className="mt-3 rounded bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</p>}
      </Modal>
    </>
  );
}
