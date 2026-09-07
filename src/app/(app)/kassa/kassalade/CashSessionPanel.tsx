'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useFormState, useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';
import { addCashMovement, closeCashSession } from '@/lib/actions/cash';
import { Button, Card, Input } from '@/components/ui/primitives';
import { formatEuro } from '@/lib/utils/currency';
import { formatDateTime } from '@/lib/utils/format';

const MOVEMENT_TYPE_KEYS: Record<string, string> = {
  withdrawal: 'typeWithdrawal',
  deposit: 'typeDeposit',
  refund: 'typeRefund',
};

function AddMovementButton() {
  const { pending } = useFormStatus();
  const t = useTranslations('cashDrawer');
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t('busy') : t('add')}
    </Button>
  );
}

export function CashSessionPanel({ session, movements }: { session: any; movements: any[] }) {
  const [state, formAction] = useFormState(addCashMovement, { error: '' });
  const [closing, setClosing] = useState(false);
  const [actualAmount, setActualAmount] = useState('');
  const [result, setResult] = useState<{ expected: number; difference: number } | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations('cashDrawer');

  function handleClose() {
    const amount = parseFloat(actualAmount);
    if (isNaN(amount)) return;
    startTransition(async () => {
      const res = await closeCashSession(session.id, amount);
      if (res.expected !== undefined) {
        setResult({ expected: res.expected, difference: res.difference! });
      }
      router.refresh();
    });
  }

  if (result) {
    return (
      <Card className="p-5 text-center">
        <h3 className="mb-3 font-display text-lg font-semibold text-ink-950">{t('drawerClosed')}</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-600">{t('expected')}</span>
            <span className="tabular-nums">{formatEuro(result.expected)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-600">{t('counted')}</span>
            <span className="tabular-nums">{formatEuro(parseFloat(actualAmount))}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>{t('difference')}</span>
            <span className={Math.abs(result.difference) > 0.01 ? 'text-red-600' : 'text-green-600'}>
              {result.difference > 0 ? '+' : ''}
              {formatEuro(result.difference)}
            </span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex justify-between text-sm">
          <span className="text-ink-600">{t('startingAmount')}</span>
          <span className="tabular-nums font-medium">{formatEuro(session.opening_amount)}</span>
        </div>
        <div className="mt-1 text-xs text-ink-400">{t('openedOn', { date: formatDateTime(session.opened_at) })}</div>
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">{t('addMovement')}</h3>
        <form action={formAction} className="flex gap-2">
          <input type="hidden" name="session_id" value={session.id} />
          <select name="type" className="rounded border border-ink-200 bg-white px-2 py-2 text-sm">
            <option value="withdrawal">{t('typeWithdrawal')}</option>
            <option value="deposit">{t('typeDeposit')}</option>
            <option value="refund">{t('typeRefund')}</option>
          </select>
          <Input name="amount" type="number" step="0.01" placeholder={t('amount')} required className="flex-1" />
          <AddMovementButton />
        </form>
        {state?.error && <p className="mt-2 text-sm text-red-700">{state.error}</p>}

        {movements.length > 0 && (
          <div className="mt-3 space-y-1 text-sm">
            {movements.map((m) => (
              <div key={m.id} className="flex justify-between text-ink-600">
                <span>{MOVEMENT_TYPE_KEYS[m.type] ? t(MOVEMENT_TYPE_KEYS[m.type] as any) : m.type}</span>
                <span className="tabular-nums">{formatEuro(m.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">{t('closeDrawer')}</h3>
        {closing ? (
          <div className="space-y-2">
            <Input
              type="number"
              step="0.01"
              placeholder={t('countedAmount')}
              value={actualAmount}
              onChange={(e) => setActualAmount(e.target.value)}
            />
            <div className="flex gap-2">
              <Button variant="primary" disabled={pending} onClick={handleClose}>
                {pending ? t('busy') : t('confirm')}
              </Button>
              <Button variant="ghost" onClick={() => setClosing(false)}>
                {t('cancel')}
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => setClosing(true)}>
            {t('countAndClose')}
          </Button>
        )}
      </Card>
    </div>
  );
}
