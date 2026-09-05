'use client';

import { useRef, useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { addRepairItem } from '@/lib/actions/repairs';
import { Button, Input } from '@/components/ui/primitives';
import { Plus } from 'lucide-react';

const TYPES = [
  { value: 'part', label: 'Onderdeel' },
  { value: 'labour', label: 'Arbeid' },
  { value: 'service', label: 'Dienst' },
  { value: 'product', label: 'Product' },
  { value: 'custom', label: 'Overig' },
];

export function AddItemForm({ repairId }: { repairId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await addRepairItem(repairId, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setError(null);
        formRef.current?.reset();
        setOpen(false);
        router.refresh();
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline"
      >
        <Plus size={15} /> Regel toevoegen
      </button>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="mt-3 space-y-2 rounded border border-ink-100 bg-ink-50 p-3">
      <div className="grid grid-cols-12 gap-2">
        <select name="item_type" className="col-span-3 rounded border border-ink-200 bg-white px-2 py-1.5 text-sm">
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <Input name="description" placeholder="Omschrijving" required className="col-span-5" />
        <Input name="quantity" type="number" step="1" defaultValue="1" className="col-span-1" />
        <Input name="price" type="number" step="0.01" placeholder="Prijs excl." required className="col-span-2" />
        <select name="vat_rate" defaultValue="21" className="col-span-1 rounded border border-ink-200 bg-white px-1 py-1.5 text-xs">
          <option value="21">21%</option>
          <option value="9">9%</option>
          <option value="0">0%</option>
        </select>
      </div>
      {error && <p className="text-xs text-red-700">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? 'Bezig…' : 'Toevoegen'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Annuleren
        </Button>
      </div>
    </form>
  );
}
