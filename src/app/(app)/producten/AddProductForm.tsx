'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createProduct, createCategory, createSupplier } from '@/lib/actions/products';
import { Button, Card, Field, Input, Textarea } from '@/components/ui/primitives';
import { Plus } from 'lucide-react';

type Option = { id: string; name: string };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? 'Bezig…' : label}
    </Button>
  );
}

function QuickAddSelect({
  name,
  options,
  action,
  placeholder,
  extraFields,
}: {
  name: string;
  options: Option[];
  action: (prevState: { error?: string }, formData: FormData) => Promise<{ error?: string }>;
  placeholder: string;
  extraFields?: { name: string; placeholder: string }[];
}) {
  const [adding, setAdding] = useState(false);
  const [state, formAction] = useFormState(action, {});

  if (adding) {
    return (
      <div className="space-y-2 rounded border border-ink-200 bg-ink-50 p-2">
        <form action={formAction} className="space-y-2">
          <Input name="name" placeholder={placeholder} required />
          {extraFields?.map((f) => (
            <Input key={f.name} name={f.name} placeholder={f.placeholder} />
          ))}
          {state?.error && <p className="text-xs text-red-700">{state.error}</p>}
          <div className="flex gap-2">
            <SubmitButton label="Opslaan" />
            <Button type="button" variant="ghost" onClick={() => setAdding(false)}>
              Annuleren
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <select name={name} className="flex-1 rounded border border-ink-200 bg-white px-3 py-2 text-sm">
        <option value="">Geen</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      <button type="button" onClick={() => setAdding(true)} className="rounded border border-ink-200 px-2 text-ink-600 hover:bg-ink-50">
        <Plus size={15} />
      </button>
    </div>
  );
}

export function AddProductForm({ categories, suppliers }: { categories: Option[]; suppliers: Option[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createProduct, {});

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline">
        <Plus size={15} /> Product toevoegen
      </button>
    );
  }

  return (
    <Card className="p-4">
      <form action={formAction} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Naam">
            <Input name="name" required placeholder="Screenprotector iPhone 13" />
          </Field>
          <Field label="SKU">
            <Input name="sku" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Categorie">
            <QuickAddSelect name="category_id" options={categories} action={createCategory} placeholder="Nieuwe categorienaam" />
          </Field>
          <Field label="Leverancier">
            <QuickAddSelect
              name="supplier_id"
              options={suppliers}
              action={createSupplier}
              placeholder="Naam leverancier"
              extraFields={[
                { name: 'contact_name', placeholder: 'Contactpersoon (optioneel)' },
                { name: 'phone', placeholder: 'Telefoon (optioneel)' },
              ]}
            />
          </Field>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <Field label="Inkoop excl. BTW">
            <Input name="purchase_price_excl_vat" type="number" step="0.01" defaultValue="0" />
          </Field>
          <Field label="Verkoop excl. BTW">
            <Input name="selling_price_excl_vat" type="number" step="0.01" required />
          </Field>
          <Field label="BTW-tarief">
            <select name="vat_rate" defaultValue="21" className="w-full rounded border border-ink-200 bg-white px-3 py-2 text-sm">
              <option value="21">21%</option>
              <option value="9">9%</option>
              <option value="0">0%</option>
            </select>
          </Field>
          <Field label="Voorraad">
            <Input name="stock_quantity" type="number" defaultValue="0" />
          </Field>
        </div>
        <Field label="Minimumvoorraad">
          <Input name="minimum_stock" type="number" defaultValue="0" className="max-w-[160px]" />
        </Field>
        <Field label="Opmerkingen">
          <Textarea name="notes" rows={2} />
        </Field>

        {state?.error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

        <div className="flex gap-2">
          <SubmitButton label="Product opslaan" />
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Annuleren
          </Button>
        </div>
      </form>
    </Card>
  );
}
