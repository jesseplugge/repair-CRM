'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { removeIntakeSignature } from '@/lib/actions/repairs';
import { Button } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { X } from 'lucide-react';

export function RemoveSignatureButton({ repairId }: { repairId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations('repairDetail');
  const tCommon = useTranslations('common');
  const tSub = useTranslations('repairSub');
  const toast = useToast();

  function confirmRemove() {
    startTransition(async () => {
      const result = await removeIntakeSignature(repairId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      toast({ variant: 'success', title: t('signatureRemoved') });
      router.refresh();
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
        className="focus-ring flex items-center gap-1 text-xs font-medium text-ink-400 hover:text-red-600"
      >
        <X size={12} /> {t('removeSignature')}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('removeSignatureConfirmTitle')}
        footer={
          <>
            <Button variant="ghost" disabled={pending} onClick={() => setOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button variant="danger" disabled={pending} onClick={confirmRemove}>
              {pending ? tSub('busy') : t('removeSignature')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-600">{t('removeSignatureConfirmBody')}</p>
        {error && <p className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </Modal>
    </>
  );
}
