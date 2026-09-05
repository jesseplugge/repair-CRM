'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateInvoiceStatus } from '@/lib/actions/invoices';

const STATUSES = [
  { value: 'draft', label: 'Concept' },
  { value: 'sent', label: 'Verzonden' },
  { value: 'paid', label: 'Betaald' },
  { value: 'partially_paid', label: 'Gedeeltelijk betaald' },
  { value: 'overdue', label: 'Vervallen' },
  { value: 'cancelled', label: 'Geannuleerd' },
];

export function InvoiceStatusSelect({ invoiceId, currentStatus }: { invoiceId: string; currentStatus: string }) {
  const [value, setValue] = useState(currentStatus);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleChange(status: string) {
    setValue(status);
    startTransition(async () => {
      await updateInvoiceStatus(invoiceId, status);
      router.refresh();
    });
  }

  return (
    <select
      value={value}
      disabled={pending}
      onChange={(e) => handleChange(e.target.value)}
      className="w-full rounded border border-ink-200 bg-white px-3 py-2 text-sm font-medium disabled:opacity-60"
    >
      {STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
