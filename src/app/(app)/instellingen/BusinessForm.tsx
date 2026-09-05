'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { updateBusiness } from '@/lib/actions/settings';
import { Button, Card, Field, Input } from '@/components/ui/primitives';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? 'Opslaan…' : 'Opslaan'}
    </Button>
  );
}

export function BusinessForm({ business }: { business: any }) {
  const [state, formAction] = useFormState(updateBusiness, { error: '' });

  return (
    <Card className="p-5">
      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Statutaire naam">
            <Input name="legal_name" defaultValue={business.legal_name} required />
          </Field>
          <Field label="Handelsnaam">
            <Input name="trading_name" defaultValue={business.trading_name ?? ''} />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Field label="Adres">
              <Input name="address" defaultValue={business.address ?? ''} />
            </Field>
          </div>
          <Field label="Postcode">
            <Input name="postcode" defaultValue={business.postcode ?? ''} />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Plaats">
            <Input name="city" defaultValue={business.city ?? ''} />
          </Field>
          <Field label="Telefoon">
            <Input name="phone" defaultValue={business.phone ?? ''} />
          </Field>
          <Field label="E-mail">
            <Input name="email" type="email" defaultValue={business.email ?? ''} />
          </Field>
        </div>
        <Field label="Website">
          <Input name="website" defaultValue={business.website ?? ''} />
        </Field>
        <div className="grid grid-cols-3 gap-4">
          <Field label="KVK-nummer">
            <Input name="kvk_number" defaultValue={business.kvk_number ?? ''} />
          </Field>
          <Field label="BTW-nummer">
            <Input name="vat_number" defaultValue={business.vat_number ?? ''} />
          </Field>
          <Field label="IBAN">
            <Input name="iban" defaultValue={business.iban ?? ''} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Standaard BTW-tarief (%)">
            <Input name="default_vat_rate" type="number" step="0.01" defaultValue={business.default_vat_rate} />
          </Field>
          <Field label="Standaard garantie (maanden)">
            <Input name="default_warranty_months" type="number" defaultValue={business.default_warranty_months} />
          </Field>
        </div>

        {state?.error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
        {state?.success && <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">Opgeslagen.</p>}

        <SubmitButton />
      </form>
    </Card>
  );
}
