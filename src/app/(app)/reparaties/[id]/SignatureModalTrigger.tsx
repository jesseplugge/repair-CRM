'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { SignatureCapture } from '@/components/SignatureCapture';
import { Button } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { PenLine } from 'lucide-react';

export function SignatureModalTrigger({
  repairId,
  activeTerms,
}: {
  repairId: string;
  activeTerms: { content: string; versionLabel: string } | null;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const t = useTranslations('repairSub');
  const toast = useToast();

  if (!activeTerms) {
    return (
      <div className="rounded border border-warning-100 bg-warning-50 px-3 py-2 text-xs text-warning-700">
        {t('noActiveTerms')}
      </div>
    );
  }

  return (
    <>
      <Button type="button" variant="primary" className="w-full" onClick={() => setOpen(true)}>
        <PenLine size={15} /> {t('letCustomerSign')}
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title={t('signTitle')}>
        <SignatureCapture
          repairId={repairId}
          termsContent={activeTerms.content}
          termsVersionLabel={activeTerms.versionLabel}
          onSuccess={() => {
            setOpen(false);
            toast({ variant: 'success', title: t('signatureSaved') });
            router.refresh();
          }}
        />
      </Modal>
    </>
  );
}
