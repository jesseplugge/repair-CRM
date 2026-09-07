'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';
import { createCreditNote } from '@/lib/actions/invoices';
import { Button, Card, Field, Input, Textarea } from '@/components/ui/primitives';
import { formatEuro } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/format';

type CreditNote = { id: string; credit_note_number: string; amount_incl_vat: number; reason: string | null; created_at: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations('creditNotes');
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? t('busy') : t('create')}
    </Button>
  );
}

export function CreditNoteManager({ invoiceId, totalInclVat, creditNotes }: { invoiceId: string; totalInclVat: number; creditNotes: CreditNote[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createCreditNote, { error: '' });
  const t = useTranslations('creditNotes');

  return (
    <Card className="p-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">{t('title')}</h3>
      {creditNotes.length > 0 ? (
        <div className="mb-3 space-y-1.5 text-sm">
          {creditNotes.map((c) => (
            <div key={c.id} className="flex justify-between">
              <span className="text-ink-600">
                {c.credit_note_number} &middot; {formatDate(c.created_at)}
              </span>
              <span className="tabular-nums font-medium text-red-600">−{formatEuro(c.amount_incl_vat)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mb-3 text-sm text-ink-400">{t('empty')}</p>
      )}

      {open ? (
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="invoice_id" value={invoiceId} />
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('amountInclVat')}>
              <Input name="amount_incl_vat" type="number" step="0.01" required defaultValue={totalInclVat.toFixed(2)} />
            </Field>
            <Field label={t('vatRate')}>
              <select name="vat_rate" defaultValue="21" className="w-full rounded border border-ink-200 bg-white px-3 py-2 text-sm">
                <option value="21">21%</option>
                <option value="9">9%</option>
                <option value="0">0%</option>
              </select>
            </Field>
          </div>
          <Field label={t('reason')}>
            <Textarea name="reason" rows={2} />
          </Field>
          {state?.error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
          <div className="flex gap-2">
            <SubmitButton />
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {t('cancel')}
            </Button>
          </div>
        </form>
      ) : (
        <button onClick={() => setOpen(true)} className="text-sm font-medium text-[var(--accent)] hover:underline">
          {t('createNew')}
        </button>
      )}
    </Card>
  );
}
