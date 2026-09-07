'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { recordRepairPayment, refundRepairPayment } from '@/lib/actions/repairs';
import { Button, Input } from '@/components/ui/primitives';
import { formatEuro } from '@/lib/utils/currency';
import { formatDateTime } from '@/lib/utils/format';
import { Banknote, CreditCard, Landmark, Undo2 } from 'lucide-react';

type Payment = { id: string; amount: number; method: string; paid_at: string; notes: string | null };

export function PaymentPanel({
  repairId,
  paymentStatus,
  totalInclVat,
  payments,
}: {
  repairId: string;
  paymentStatus: string;
  totalInclVat: number;
  payments: Payment[];
}) {
  const [open, setOpen] = useState(false);
  const paidSoFar = payments.reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, Math.round((totalInclVat - paidSoFar) * 100) / 100);
  const [amount, setAmount] = useState(remaining.toFixed(2));
  const [method, setMethod] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations('repairSub');

  const METHODS = [
    { value: 'contant', label: t('methodCash'), icon: Banknote },
    { value: 'pin', label: t('methodPin'), icon: CreditCard },
    { value: 'bankoverschrijving', label: t('methodBank'), icon: Landmark },
  ];
  const methodLabel = (v: string) => METHODS.find((m) => m.value === v)?.label ?? v;

  function submit() {
    if (!method) return;
    startTransition(async () => {
      await recordRepairPayment(repairId, parseFloat(amount), method);
      setOpen(false);
      router.refresh();
    });
  }

  function handleRefund(paymentId: string, maxAmount: number) {
    const amountStr = window.prompt(t('refundPrompt', { max: formatEuro(maxAmount) }), maxAmount.toFixed(2));
    if (!amountStr) return;
    const refundAmount = parseFloat(amountStr);
    if (isNaN(refundAmount) || refundAmount <= 0) return;
    startTransition(async () => {
      await refundRepairPayment(repairId, paymentId, refundAmount, 'contant');
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {payments.length > 0 && (
        <div className="space-y-1.5">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded border border-ink-100 px-2.5 py-1.5 text-xs">
              <div>
                <div className="font-medium tabular-nums text-ink-900">{formatEuro(p.amount)}</div>
                <div className="text-ink-400">
                  {methodLabel(p.method)} &middot; {formatDateTime(p.paid_at)}
                </div>
              </div>
              <button onClick={() => handleRefund(p.id, p.amount)} className="text-ink-300 hover:text-red-600" title={t('refund')}>
                <Undo2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {paymentStatus === 'paid' ? (
        <div className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">{t('fullyPaid')}</div>
      ) : open ? (
        <div className="space-y-3">
          {paidSoFar > 0 && (
            <p className="text-xs text-amber-700">
              {t('paidSoFarRemaining', { paid: formatEuro(paidSoFar), remaining: formatEuro(remaining) })}
            </p>
          )}
          <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <div className="grid grid-cols-3 gap-2">
            {METHODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMethod(m.value)}
                className={`flex flex-col items-center gap-1 rounded border px-2 py-3 text-xs font-medium transition-colors ${
                  method === m.value ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-ink-200 text-ink-600 hover:bg-ink-50'
                }`}
              >
                <m.icon size={18} />
                {m.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="primary" className="flex-1" disabled={!method || pending} onClick={submit}>
              {pending ? t('busy') : t('confirmAmount', { amount: formatEuro(parseFloat(amount || '0')) })}
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {t('cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="primary" className="w-full" onClick={() => setOpen(true)}>
          {paymentStatus === 'partial' ? t('registerRemaining', { amount: formatEuro(remaining) }) : t('registerPayment')}
        </Button>
      )}
    </div>
  );
}
