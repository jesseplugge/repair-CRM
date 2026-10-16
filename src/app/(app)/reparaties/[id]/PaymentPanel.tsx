'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { recordRepairPayment, refundRepairPayment, updateRepairPayment } from '@/lib/actions/repairs';
import { Button, Input, Label } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { formatEuro } from '@/lib/utils/currency';
import { formatDateTime, toDateTimeLocalValue } from '@/lib/utils/format';
import { Banknote, CreditCard, Landmark, Link2, Pencil, Undo2 } from 'lucide-react';

type Payment = {
  id: string;
  amount: number;
  method: string;
  paid_at: string;
  notes: string | null;
  transaction_id: string | null;
  tip_amount: number;
};

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
  const [transactionId, setTransactionId] = useState('');
  const [tipAmount, setTipAmount] = useState('');
  const [refundTarget, setRefundTarget] = useState<Payment | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [editTarget, setEditTarget] = useState<Payment | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editMethod, setEditMethod] = useState<string | null>(null);
  const [editTransactionId, setEditTransactionId] = useState('');
  const [editTipAmount, setEditTipAmount] = useState('');
  const [editPaidAt, setEditPaidAt] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations('repairSub');
  const tCommon = useTranslations('common');
  const toast = useToast();

  const METHODS = [
    { value: 'contant', label: t('methodCash'), icon: Banknote },
    { value: 'pin', label: t('methodPin'), icon: CreditCard },
    { value: 'bankoverschrijving', label: t('methodBank'), icon: Landmark },
    { value: 'tikkie', label: t('methodTikkie'), icon: Link2 },
  ];
  const methodLabel = (v: string) => METHODS.find((m) => m.value === v)?.label ?? v;

  function submit() {
    if (!method) return;
    const tip = parseFloat(tipAmount || '0') || 0;
    startTransition(async () => {
      await recordRepairPayment(repairId, parseFloat(amount), method, undefined, {
        transactionId: transactionId.trim() || null,
        tipAmount: tip,
      });
      setOpen(false);
      setTransactionId('');
      setTipAmount('');
      toast({ variant: 'success', title: t('paymentRecorded') });
      router.refresh();
    });
  }

  function startEdit(payment: Payment) {
    setEditTarget(payment);
    setEditAmount(payment.amount.toFixed(2));
    setEditMethod(payment.method);
    setEditTransactionId(payment.transaction_id ?? '');
    setEditTipAmount(payment.tip_amount ? payment.tip_amount.toFixed(2) : '');
    setEditPaidAt(toDateTimeLocalValue(payment.paid_at));
    setEditNotes(payment.notes ?? '');
  }

  function saveEdit() {
    if (!editTarget || !editMethod || !editPaidAt) return;
    const amountValue = parseFloat(editAmount);
    if (isNaN(amountValue) || amountValue <= 0) return;
    startTransition(async () => {
      const result = await updateRepairPayment(repairId, editTarget.id, {
        amount: amountValue,
        method: editMethod,
        transactionId: editTransactionId.trim() || null,
        tipAmount: parseFloat(editTipAmount || '0') || 0,
        paidAt: editPaidAt,
        notes: editNotes.trim() || null,
      });
      if (!result?.error) {
        setEditTarget(null);
        toast({ variant: 'success', title: t('editPaymentSaved') });
        router.refresh();
      }
    });
  }

  function openRefund(payment: Payment) {
    setRefundTarget(payment);
    setRefundAmount(payment.amount.toFixed(2));
  }

  function submitRefund() {
    if (!refundTarget) return;
    const value = parseFloat(refundAmount);
    if (isNaN(value) || value <= 0) return;
    startTransition(async () => {
      await refundRepairPayment(repairId, refundTarget.id, value, 'contant');
      setRefundTarget(null);
      toast({ variant: 'success', title: t('refundIssued') });
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
                <div className="font-mono font-medium tabular-nums text-ink-900">
                  {formatEuro(p.amount)}
                  {p.tip_amount > 0 && <span className="text-ink-400"> + {formatEuro(p.tip_amount)} {t('tipInline')}</span>}
                </div>
                <div className="flex items-center gap-1 text-ink-400">
                  {methodLabel(p.method)} &middot; {formatDateTime(p.paid_at)}
                  {p.transaction_id && (
                    <>
                      {' '}
                      &middot; <span className="font-mono">{p.transaction_id}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button onClick={() => startEdit(p)} className="focus-ring text-ink-300 hover:text-ink-700" title={t('editPayment')}>
                  <Pencil size={13} />
                </button>
                <button onClick={() => openRefund(p)} className="focus-ring text-ink-300 hover:text-danger-600" title={t('refund')}>
                  <Undo2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {paymentStatus === 'paid' ? (
        <div className="rounded bg-success-50 px-3 py-2 text-sm text-success-700">{t('fullyPaid')}</div>
      ) : open ? (
        <div className="space-y-3">
          {paidSoFar > 0 && (
            <p className="text-xs text-warning-700">
              {t('paidSoFarRemaining', { paid: formatEuro(paidSoFar), remaining: formatEuro(remaining) })}
            </p>
          )}
          <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            {METHODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMethod(m.value)}
                className={`focus-ring flex flex-col items-center gap-1 rounded border px-2 py-3 text-xs font-medium transition-colors ${
                  method === m.value ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-ink-200 text-ink-600 hover:bg-ink-50'
                }`}
              >
                <m.icon size={18} />
                {m.label}
              </button>
            ))}
          </div>
          <Input
            type="text"
            placeholder={t('transactionIdOptional')}
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
          />
          <Input
            type="number"
            step="0.01"
            placeholder={t('tipOptional')}
            value={tipAmount}
            onChange={(e) => setTipAmount(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="primary" className="flex-1" disabled={!method || pending} onClick={submit}>
              {pending
                ? t('busy')
                : t('confirmAmount', {
                    amount: formatEuro((parseFloat(amount || '0') || 0) + (parseFloat(tipAmount || '0') || 0)),
                  })}
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

      <Modal
        open={refundTarget !== null}
        onClose={() => setRefundTarget(null)}
        title={t('refundTitle')}
        footer={
          <>
            <Button variant="ghost" disabled={pending} onClick={() => setRefundTarget(null)}>
              {t('cancel')}
            </Button>
            <Button variant="danger" disabled={pending} onClick={submitRefund}>
              {pending ? t('busy') : tCommon('confirm')}
            </Button>
          </>
        }
      >
        <Label htmlFor="refund-amount">{t('refundAmountLabel')}</Label>
        <Input
          id="refund-amount"
          type="number"
          step="0.01"
          value={refundAmount}
          onChange={(e) => setRefundAmount(e.target.value)}
          autoFocus
        />
        {refundTarget && <p className="mt-1.5 text-xs text-ink-400">{t('refundMax', { max: formatEuro(refundTarget.amount) })}</p>}
      </Modal>

      <Modal
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        title={t('editPayment')}
        footer={
          <>
            <Button variant="ghost" disabled={pending} onClick={() => setEditTarget(null)}>
              {t('cancel')}
            </Button>
            <Button variant="primary" disabled={pending || !editMethod} onClick={saveEdit}>
              {pending ? t('busy') : tCommon('save')}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <Label htmlFor="edit-amount">{t('amountLabel')}</Label>
            <Input id="edit-amount" type="number" step="0.01" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {METHODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setEditMethod(m.value)}
                className={`focus-ring flex flex-col items-center gap-1 rounded border px-2 py-3 text-xs font-medium transition-colors ${
                  editMethod === m.value ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-ink-200 text-ink-600 hover:bg-ink-50'
                }`}
              >
                <m.icon size={18} />
                {m.label}
              </button>
            ))}
          </div>
          <div>
            <Label htmlFor="edit-paid-at">{t('editPaymentTime')}</Label>
            <Input id="edit-paid-at" type="datetime-local" value={editPaidAt} onChange={(e) => setEditPaidAt(e.target.value)} />
          </div>
          <Input
            type="text"
            placeholder={t('transactionIdOptional')}
            value={editTransactionId}
            onChange={(e) => setEditTransactionId(e.target.value)}
          />
          <Input type="number" step="0.01" placeholder={t('tipOptional')} value={editTipAmount} onChange={(e) => setEditTipAmount(e.target.value)} />
          <Input type="text" placeholder={t('paymentNotesOptional')} value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}
