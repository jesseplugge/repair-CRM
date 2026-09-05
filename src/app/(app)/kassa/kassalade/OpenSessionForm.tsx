'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { openCashSession } from '@/lib/actions/cash';
import { Button, Card, Field, Input } from '@/components/ui/primitives';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>
      {pending ? 'Bezig…' : 'Kassa openen'}
    </Button>
  );
}

export function OpenSessionForm() {
  const [state, formAction] = useFormState(openCashSession, {});

  return (
    <Card className="p-5">
      <form action={formAction} className="space-y-4">
        <Field label="Startbedrag in kassa">
          <Input name="opening_amount" type="number" step="0.01" required placeholder="150.00" />
        </Field>
        {state?.error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
        <SubmitButton />
      </form>
    </Card>
  );
}
