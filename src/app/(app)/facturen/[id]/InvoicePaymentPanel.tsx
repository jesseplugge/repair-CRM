'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { recordInvoicePayment } from '@/lib/actions/invoices';
import { Button, Input } from '@/components/ui/primitives';
import { formatEuro } from '@/lib/utils/currency';
import { formatDateTime } from '@/lib/utils/format';

const METHODS = ['contant', 'pin', 'bankoverschrijving'];

type Payment = { id: string; amount: number; method: string; paid_at: string };

export function InvoicePaymentPanel({
  invoiceId,
  status,
  totalInclVat,
  payments,
}: {
  invoiceId: string;
  status: string;
  totalInclVat: number;
  payments: Payment[];
}) {
  const paidSoFar = payments.reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, Math.round((totalInclVat - paidSoFar) * 100) / 100);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(remaining.toFixed(2));
  const [method, setMethod] = useState('contant');
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    startTransition(async () => {
      await recordInvoicePayment(invoiceId, parseFloat(amount), method);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      {payments.map((p) => (
        <div key={p.id} className="flex justify-between text-xs text-ink-500">
          <span>
            {p.method} &middot; {formatDateTime(p.paid_at)}
          </span>
          <span className="tabular-nums">{formatEuro(p.amount)}</span>
        </div>
      ))}

      {status === 'paid' ? (
        <div className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">Volledig betaald</div>
      ) : open ? (
        <div className="space-y-2">
          <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full rounded border border-ink-200 bg-white px-3 py-2 text-sm">
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <Button variant="primary" className="flex-1" disabled={pending} onClick={submit}>
              {pending ? 'Bezig…' : 'Bevestigen'}
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuleren
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="primary" className="w-full" onClick={() => setOpen(true)}>
          Betaling registreren
        </Button>
      )}
    </div>
  );
}
