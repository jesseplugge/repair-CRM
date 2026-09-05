'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createCatalogItem, toggleCatalogItem } from '@/lib/actions/settings';
import { Button, Card, Field, Input } from '@/components/ui/primitives';
import { formatEuro } from '@/lib/utils/currency';
import { Plus } from 'lucide-react';

type CatalogItem = {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  category: string | null;
  selling_price: number;
  vat_rate: number;
  part_cost: number | null;
  labour_price: number | null;
  warranty_months: number | null;
  active: boolean;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? 'Bezig…' : 'Toevoegen'}
    </Button>
  );
}

export function CatalogManager({ items }: { items: CatalogItem[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createCatalogItem, { error: '' });

  return (
    <div className="space-y-3">
      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400">
              <th className="px-4 py-2.5 font-medium">Naam</th>
              <th className="px-4 py-2.5 font-medium">Merk / model</th>
              <th className="px-4 py-2.5 text-right font-medium">Prijs excl. BTW</th>
              <th className="px-4 py-2.5 text-right font-medium">BTW</th>
              <th className="px-4 py-2.5 text-right font-medium">Garantie</th>
              <th className="px-4 py-2.5 font-medium">Actief</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-ink-100 last:border-0">
                <td className="px-4 py-2.5 font-medium text-ink-900">{item.name}</td>
                <td className="px-4 py-2.5 text-ink-600">
                  {item.brand} {item.model}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-ink-900">{formatEuro(item.selling_price)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-ink-600">{item.vat_rate}%</td>
                <td className="px-4 py-2.5 text-right text-ink-600">{item.warranty_months ?? '–'} mnd</td>
                <td className="px-4 py-2.5">
                  <button
                    onClick={() => toggleCatalogItem(item.id, !item.active)}
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.active ? 'bg-green-100 text-green-700' : 'bg-ink-100 text-ink-500'
                    }`}
                  >
                    {item.active ? 'Actief' : 'Inactief'}
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-400">
                  Nog geen reparatietypes. Voeg er hieronder een toe.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {open ? (
        <Card className="p-4">
          <form action={formAction} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Naam">
                <Input name="name" required placeholder="iPhone 13 - Scherm vervangen" />
              </Field>
              <Field label="Categorie">
                <Input name="category" placeholder="Scherm" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Merk">
                <Input name="brand" placeholder="Apple" />
              </Field>
              <Field label="Model">
                <Input name="model" placeholder="iPhone 13" />
              </Field>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <Field label="Verkoopprijs (excl. BTW)">
                <Input name="selling_price" type="number" step="0.01" required />
              </Field>
              <Field label="BTW-tarief">
                <select name="vat_rate" defaultValue="21" className="w-full rounded border border-ink-200 bg-white px-3 py-2 text-sm">
                  <option value="21">21%</option>
                  <option value="9">9%</option>
                  <option value="0">0%</option>
                </select>
              </Field>
              <Field label="Onderdeelkosten">
                <Input name="part_cost" type="number" step="0.01" defaultValue="0" />
              </Field>
              <Field label="Garantie (mnd)">
                <Input name="warranty_months" type="number" defaultValue="3" />
              </Field>
            </div>

            {state?.error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

            <div className="flex gap-2">
              <SubmitButton />
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Annuleren
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline"
        >
          <Plus size={15} /> Reparatietype toevoegen
        </button>
      )}
    </div>
  );
}
