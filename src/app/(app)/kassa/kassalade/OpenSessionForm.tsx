'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';
import { openCashSession } from '@/lib/actions/cash';
import { Button, Card, Field, Input } from '@/components/ui/primitives';

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations('cashDrawer');
  return (
    <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>
      {pending ? t('busy') : t('openDrawer')}
    </Button>
  );
}

export function OpenSessionForm() {
  const [state, formAction] = useFormState(openCashSession, { error: '' });
  const t = useTranslations('cashDrawer');

  return (
    <Card className="p-5">
      <form action={formAction} className="space-y-4">
        <Field label={t('openingAmount')}>
          <Input name="opening_amount" type="number" step="0.01" required placeholder="150.00" />
        </Field>
        {state?.error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
        <SubmitButton />
      </form>
    </Card>
  );
}
