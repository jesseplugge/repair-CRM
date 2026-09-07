'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { updateInvoiceStatus } from '@/lib/actions/invoices';

const STATUS_VALUES = ['draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled'];

export function InvoiceStatusSelect({ invoiceId, currentStatus }: { invoiceId: string; currentStatus: string }) {
  const [value, setValue] = useState(currentStatus);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations('invoiceStatus');

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
      {STATUS_VALUES.map((s) => (
        <option key={s} value={s}>
          {t(s as any)}
        </option>
      ))}
    </select>
  );
}
