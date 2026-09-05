'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createDevice } from '@/lib/actions/devices';
import { Button, Card, Field, Input, Textarea } from '@/components/ui/primitives';
import { Plus } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? 'Bezig…' : 'Apparaat opslaan'}
    </Button>
  );
}

export function AddDeviceForm({ customerId }: { customerId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createDevice, { error: '' });

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded border border-dashed border-ink-200 py-3 text-sm font-medium text-ink-600 hover:border-[var(--accent)] hover:text-[var(--accent)]"
      >
        <Plus size={16} /> Apparaat toevoegen
      </button>
    );
  }

  return (
    <Card className="p-4">
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="customer_id" value={customerId} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Merk">
            <Input name="brand" required placeholder="Apple" />
          </Field>
          <Field label="Model">
            <Input name="model" required placeholder="iPhone 13" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Kleur">
            <Input name="color" />
          </Field>
          <Field label="Opslagcapaciteit">
            <Input name="storage_capacity" placeholder="128GB" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="IMEI (optioneel)">
            <Input name="imei" />
          </Field>
          <Field label="Serienummer (optioneel)">
            <Input name="serial_number" />
          </Field>
        </div>
        <Field label="Staat / bestaande schade">
          <Textarea name="existing_damage" rows={2} placeholder="Bijv. barst rechtsboven op scherm" />
        </Field>
        <Field label="Opmerkingen">
          <Textarea name="notes" rows={2} />
        </Field>

        {state?.error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

        <div className="flex gap-2 pt-1">
          <SubmitButton />
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Annuleren
          </Button>
        </div>
      </form>
    </Card>
  );
}
