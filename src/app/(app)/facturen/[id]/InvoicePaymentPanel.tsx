'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { recordInvoicePayment, updateInvoicePaymentTime } from '@/lib/actions/invoices';
import { Button, Input } from '@/components/ui/primitives';
import { formatEuro } from '@/lib/utils/currency';
import { formatDateTime, toDateTimeLocalValue } from '@/lib/utils/format';
import { Pencil } from 'lucide-react';

const METHODS = ['contant', 'pin', 'bankoverschrijving', 'tikkie'];
const METHOD_KEYS: Record<string, string> = {
  contant: 'methodCash',
  pin: 'methodPin',
  bankoverschrijving: 'methodBank',
  tikkie: 'methodTikkie',
};

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
  const [transactionId, setTransactionId] = useState('');
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  const [editPaidAt, setEditPaidAt] = useState('');
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations('invoiceDetail');
  const tCommon = useTranslations('common');

  function submit() {
    startTransition(async () => {
      await recordInvoicePayment(invoiceId, parseFloat(amount), method, transactionId.trim() || null);
      setOpen(false);
      setTransactionId('');
      router.refresh();
    });
  }

  function startEditTime(payment: Payment) {
    setEditingTimeId(payment.id);
    setEditPaidAt(toDateTimeLocalValue(payment.paid_at));
  }

  function saveEditTime() {
    if (!editingTimeId || !editPaidAt) return;
    startTransition(async () => {
      const result = await updateInvoicePaymentTime(invoiceId, editingTimeId, editPaidAt);
      if (!result?.error) {
        setEditingTimeId(null);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-2">
      {payments.map((p) =>
        editingTimeId === p.id ? (
          <div key={p.id} className="flex items-center gap-1.5 text-xs">
            <Input type="datetime-local" value={editPaidAt} onChange={(e) => setEditPaidAt(e.target.value)} className="!py-1 text-xs" autoFocus />
            <button onClick={saveEditTime} disabled={pending} className="focus-ring shrink-0 font-medium text-[var(--accent)] hover:underline">
              {tCommon('save')}
            </button>
            <button onClick={() => setEditingTimeId(null)} className="focus-ring shrink-0 text-ink-400 hover:text-ink-700">
              {t('cancel')}
            </button>
          </div>
        ) : (
          <div key={p.id} className="flex items-center justify-between text-xs text-ink-500">
            <span className="flex items-center gap-1">
              {METHOD_KEYS[p.method] ? t(METHOD_KEYS[p.method] as any) : p.method} &middot; {formatDateTime(p.paid_at)}
              <button onClick={() => startEditTime(p)} className="focus-ring text-ink-300 hover:text-ink-700">
                <Pencil size={11} />
              </button>
            </span>
            <span className="tabular-nums">{formatEuro(p.amount)}</span>
          </div>
        )
      )}

      {status === 'paid' ? (
        <div className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">{t('fullyPaid')}</div>
      ) : open ? (
        <div className="space-y-2">
          <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full rounded border border-ink-200 bg-white px-3 py-2 text-sm">
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {t(METHOD_KEYS[m] as any)}
              </option>
            ))}
          </select>
          <Input
            type="text"
            placeholder={t('transactionIdOptional')}
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="primary" className="flex-1" disabled={pending} onClick={submit}>
              {pending ? t('busy') : t('confirm')}
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {t('cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="primary" className="w-full" onClick={() => setOpen(true)}>
          {t('registerPayment')}
        </Button>
      )}
    </div>
  );
}
