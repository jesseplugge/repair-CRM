'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';
import { createDevice } from '@/lib/actions/devices';
import { Button, Card, Field, Input, Textarea } from '@/components/ui/primitives';
import { Plus } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations('addDevice');
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? t('busy') : t('save')}
    </Button>
  );
}

export function AddDeviceForm({ customerId }: { customerId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createDevice, { error: '' });
  const t = useTranslations('addDevice');

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded border border-dashed border-ink-200 py-3 text-sm font-medium text-ink-600 hover:border-[var(--accent)] hover:text-[var(--accent)]"
      >
        <Plus size={16} /> {t('addDevice')}
      </button>
    );
  }

  return (
    <Card className="p-4">
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="customer_id" value={customerId} />
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('brand')}>
            <Input name="brand" required placeholder="Apple" />
          </Field>
          <Field label={t('model')}>
            <Input name="model" required placeholder="iPhone 13" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('color')}>
            <Input name="color" />
          </Field>
          <Field label={t('storage')}>
            <Input name="storage_capacity" placeholder="128GB" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('imeiOptional')}>
            <Input name="imei" />
          </Field>
          <Field label={t('serialOptional')}>
            <Input name="serial_number" />
          </Field>
        </div>
        <Field label={t('conditionDamage')}>
          <Textarea name="existing_damage" rows={2} placeholder={t('conditionPlaceholder')} />
        </Field>
        <Field label={t('notes')}>
          <Textarea name="notes" rows={2} />
        </Field>

        {state?.error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

        <div className="flex gap-2 pt-1">
          <SubmitButton />
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            {t('cancel')}
          </Button>
        </div>
      </form>
    </Card>
  );
}
