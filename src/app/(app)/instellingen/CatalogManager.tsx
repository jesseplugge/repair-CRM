'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('catalogManager');
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? t('busy') : t('add')}
    </Button>
  );
}

export function CatalogManager({ items }: { items: CatalogItem[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createCatalogItem, { error: '' });
  const t = useTranslations('catalogManager');

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <Card>
          <p className="px-4 py-8 text-center text-sm text-ink-400">{t('empty')}</p>
        </Card>
      ) : (
        <>
          <Card className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400">
                  <th className="px-4 py-2.5 font-medium">{t('colName')}</th>
                  <th className="px-4 py-2.5 font-medium">{t('colBrandModel')}</th>
                  <th className="px-4 py-2.5 text-right font-medium">{t('colPriceExcl')}</th>
                  <th className="px-4 py-2.5 text-right font-medium">{t('colVat')}</th>
                  <th className="px-4 py-2.5 text-right font-medium">{t('colWarranty')}</th>
                  <th className="px-4 py-2.5 font-medium">{t('colActive')}</th>
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
                    <td className="px-4 py-2.5 text-right text-ink-600">{item.warranty_months ?? '–'} {t('months')}</td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => toggleCatalogItem(item.id, !item.active)}
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          item.active ? 'bg-green-100 text-green-700' : 'bg-ink-100 text-ink-500'
                        }`}
                      >
                        {item.active ? t('active') : t('inactive')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <div className="space-y-2 md:hidden">
            {items.map((item) => (
              <div key={item.id} className="rounded-lg border border-ink-100 bg-white p-3 shadow-card">
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate font-medium text-ink-900">{item.name}</span>
                  <button
                    onClick={() => toggleCatalogItem(item.id, !item.active)}
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.active ? 'bg-green-100 text-green-700' : 'bg-ink-100 text-ink-500'
                    }`}
                  >
                    {item.active ? t('active') : t('inactive')}
                  </button>
                </div>
                <div className="break-words text-xs text-ink-400">
                  {item.brand} {item.model}
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate text-ink-600">
                    {t('colVat')} {item.vat_rate}% · {item.warranty_months ?? '–'} {t('months')}
                  </span>
                  <span className="shrink-0 font-medium text-ink-900">{formatEuro(item.selling_price)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {open ? (
        <Card className="p-4">
          <form action={formAction} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('name')}>
                <Input name="name" required placeholder={t('namePlaceholder')} />
              </Field>
              <Field label={t('category')}>
                <Input name="category" placeholder={t('categoryPlaceholder')} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('brand')}>
                <Input name="brand" placeholder="Apple" />
              </Field>
              <Field label={t('model')}>
                <Input name="model" placeholder="iPhone 13" />
              </Field>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <Field label={t('sellingPrice')}>
                <Input name="selling_price" type="number" step="0.01" required />
              </Field>
              <Field label={t('vatRate')}>
                <select name="vat_rate" defaultValue="21" className="w-full rounded border border-ink-200 bg-white px-3 py-2 text-sm">
                  <option value="21">21%</option>
                  <option value="9">9%</option>
                  <option value="0">0%</option>
                </select>
              </Field>
              <Field label={t('partCost')}>
                <Input name="part_cost" type="number" step="0.01" defaultValue="0" />
              </Field>
              <Field label={t('warrantyMonths')}>
                <Input name="warranty_months" type="number" defaultValue="3" />
              </Field>
            </div>

            {state?.error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

            <div className="flex gap-2">
              <SubmitButton />
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                {t('cancel')}
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline"
        >
          <Plus size={15} /> {t('addRepairType')}
        </button>
      )}
    </div>
  );
}
