'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/modal';
import { Trash2 } from 'lucide-react';

export function ConfirmDeleteButton({
  title,
  body,
  onConfirm,
}: {
  title: string;
  body: string;
  onConfirm: () => Promise<{ error?: string } | void>;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations('common');

  function confirmDelete() {
    startTransition(async () => {
      const result = await onConfirm();
      if (result?.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
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
        className="focus-ring rounded p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600"
        aria-label={t('delete')}
      >
        <Trash2 size={15} />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        footer={
          <>
            <Button variant="ghost" disabled={pending} onClick={() => setOpen(false)}>
              {t('cancel')}
            </Button>
            <Button variant="danger" disabled={pending} onClick={confirmDelete}>
              {pending ? t('busy') : t('delete')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-600">{body}</p>
        {error && <p className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </Modal>
    </>
  );
}
