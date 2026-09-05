'use client';

import { useEffect, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createManualInvoice } from '@/lib/actions/invoices';
import { Button, Card, Field, Input, Textarea } from '@/components/ui/primitives';
import { Plus, Trash2, Search } from 'lucide-react';

type CustomerLite = { id: string; first_name: string; last_name: string; phone: string | null };
type Line = { id: string; description: string; quantity: string; price: string; vatRate: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" disabled={pending}>
      {pending ? 'Bezig…' : 'Factuur aanmaken'}
    </Button>
  );
}

export function ManualInvoiceForm() {
  const [state, formAction] = useFormState(createManualInvoice, { error: '' });
  const [customer, setCustomer] = useState<CustomerLite | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CustomerLite[]>([]);
  const [lines, setLines] = useState<Line[]>([{ id: crypto.randomUUID(), description: '', quantity: '1', price: '', vatRate: '21' }]);

  useEffect(() => {
    if (customer || query.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/customers/search?q=${encodeURIComponent(query)}`);
      setResults(res.ok ? await res.json() : []);
    }, 250);
    return () => clearTimeout(t);
  }, [query, customer]);

  function updateLine(id: string, patch: Partial<Line>) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, { id: crypto.randomUUID(), description: '', quantity: '1', price: '', vatRate: '21' }]);
  }

  function removeLine(id: string) {
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev));
  }

  return (
    <form action={formAction} className="space-y-4">
      <Card className="p-5">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Klant</h3>
        {customer ? (
          <div className="flex items-center justify-between rounded border border-[var(--accent-border-soft)] bg-[var(--accent-soft)] px-3 py-2">
            <span className="text-sm font-medium">
              {customer.first_name} {customer.last_name}
            </span>
            <button type="button" onClick={() => setCustomer(null)} className="text-xs text-[var(--accent)] underline">
              Wijzigen
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Zoek klant…" className="pl-9" />
            {results.length > 0 && (
              <div className="mt-1 divide-y divide-ink-100 rounded border border-ink-100">
                {results.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCustomer(c)}
                    className="block w-full px-3 py-1.5 text-left text-sm hover:bg-ink-50"
                  >
                    {c.first_name} {c.last_name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {customer && <input type="hidden" name="customer_id" value={customer.id} />}
      </Card>

      <Card className="p-5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">Regels</h3>
        <div className="space-y-2">
          {lines.map((l) => (
            <div key={l.id} className="grid grid-cols-12 gap-2">
              <Input
                name="line_description"
                value={l.description}
                onChange={(e) => updateLine(l.id, { description: e.target.value })}
                placeholder="Omschrijving"
                className="col-span-5"
              />
              <Input
                name="line_quantity"
                type="number"
                value={l.quantity}
                onChange={(e) => updateLine(l.id, { quantity: e.target.value })}
                className="col-span-1"
              />
              <Input
                name="line_price"
                type="number"
                step="0.01"
                value={l.price}
                onChange={(e) => updateLine(l.id, { price: e.target.value })}
                placeholder="Prijs excl."
                className="col-span-3"
              />
              <select
                name="line_vat_rate"
                value={l.vatRate}
                onChange={(e) => updateLine(l.id, { vatRate: e.target.value })}
                className="col-span-2 rounded border border-ink-200 bg-white px-2 py-2 text-sm"
              >
                <option value="21">21%</option>
                <option value="9">9%</option>
                <option value="0">0%</option>
              </select>
              <button type="button" onClick={() => removeLine(l.id)} className="col-span-1 flex items-center justify-center text-ink-300 hover:text-red-600">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addLine} className="mt-3 flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline">
          <Plus size={15} /> Regel toevoegen
        </button>
      </Card>

      <Card className="p-5">
        <Field label="Opmerkingen">
          <Textarea name="notes" rows={2} />
        </Field>
      </Card>

      {state?.error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
