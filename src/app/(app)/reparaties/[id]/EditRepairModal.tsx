'use client';

import { useRef, useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { updateRepairDetails } from '@/lib/actions/repairs';
import { Button, Field, Input, Textarea } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { Pencil } from 'lucide-react';

function toLocalInputValue(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EditRepairModal({
  repairId,
  dateReceived,
  dateCompleted,
  datePickedUp,
  customerComplaint,
  technicianNotes,
  warrantyMonths,
}: {
  repairId: string;
  dateReceived: string;
  dateCompleted: string | null;
  datePickedUp: string | null;
  customerComplaint: string | null;
  technicianNotes: string | null;
  warrantyMonths: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const t = useTranslations('repairDetail');
  const tCommon = useTranslations('common');
  const tSub = useTranslations('repairSub');
  const toast = useToast();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateRepairDetails(repairId, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setError(null);
      setOpen(false);
      toast({ variant: 'success', title: t('repairUpdated') });
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
        className="focus-ring flex items-center gap-1.5 rounded px-2 py-1.5 text-sm font-medium text-ink-500 hover:bg-ink-100 hover:text-ink-800"
      >
        <Pencil size={15} /> {t('editRepair')}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('editRepair')}
        size="lg"
        footer={
          <>
            <Button type="button" variant="ghost" disabled={pending} onClick={() => setOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button type="submit" form="edit-repair-form" variant="primary" disabled={pending}>
              {pending ? tSub('busy') : tCommon('save')}
            </Button>
          </>
        }
      >
        <form ref={formRef} id="edit-repair-form" onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label={t('dateReceived')}>
              <Input type="datetime-local" name="date_received" defaultValue={toLocalInputValue(dateReceived)} required />
            </Field>
            <Field label={t('dateCompleted')}>
              <Input type="datetime-local" name="date_completed" defaultValue={toLocalInputValue(dateCompleted)} />
            </Field>
            <Field label={t('datePickedUp')}>
              <Input type="datetime-local" name="date_picked_up" defaultValue={toLocalInputValue(datePickedUp)} />
            </Field>
          </div>
          <Field label={t('complaintLabel')}>
            <Textarea name="customer_complaint" rows={2} defaultValue={customerComplaint ?? ''} />
          </Field>
          <Field label={t('technicianNotesLabel')}>
            <Textarea name="technician_notes" rows={2} defaultValue={technicianNotes ?? ''} />
          </Field>
          <Field label={t('warrantyMonthsField')}>
            <Input type="number" min="0" name="warranty_months" defaultValue={warrantyMonths ?? ''} className="max-w-[8rem]" />
          </Field>
          {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </form>
      </Modal>
    </>
  );
}
