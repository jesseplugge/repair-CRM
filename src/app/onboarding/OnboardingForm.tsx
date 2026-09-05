'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createBusiness } from './actions';
import { Button, Card, Field, Input } from '@/components/ui/primitives';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>
      {pending ? 'Bezig…' : 'Bedrijf aanmaken en starten'}
    </Button>
  );
}

export function OnboardingForm({ defaultEmail }: { defaultEmail: string }) {
  const [state, formAction] = useFormState(createBusiness, {});

  return (
    <Card className="p-6">
      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Bedrijfsnaam (statutair)">
            <Input name="legal_name" required placeholder="Jansen Telefoonreparatie B.V." />
          </Field>
          <Field label="Handelsnaam (optioneel)">
            <Input name="trading_name" placeholder="Jansen GSM Service" />
          </Field>
        </div>
        <Field label="Jouw naam">
          <Input name="full_name" required placeholder="Voor- en achternaam" />
        </Field>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Field label="Adres">
              <Input name="address" placeholder="Straatnaam 12" />
            </Field>
          </div>
          <Field label="Postcode">
            <Input name="postcode" placeholder="1234 AB" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Plaats">
            <Input name="city" placeholder="Amsterdam" />
          </Field>
          <Field label="Telefoonnummer">
            <Input name="phone" placeholder="020 1234567" />
          </Field>
        </div>
        <Field label="E-mail (voor bonnen/facturen)">
          <Input name="email" type="email" defaultValue={defaultEmail} />
        </Field>
        <div className="grid grid-cols-3 gap-4">
          <Field label="KVK-nummer">
            <Input name="kvk_number" placeholder="12345678" />
          </Field>
          <Field label="BTW-nummer">
            <Input name="vat_number" placeholder="NL123456789B01" />
          </Field>
          <Field label="IBAN">
            <Input name="iban" placeholder="NL00 BANK 0000 0000 00" />
          </Field>
        </div>

        {state?.error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

        <SubmitButton />
      </form>
    </Card>
  );
}
