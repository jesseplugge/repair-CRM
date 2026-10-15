'use client';

import { useTranslations } from 'next-intl';

export function StatusBadge({ name, color }: { name: string; color: string | null }) {
  const hex = color ?? '#3C4C54';
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold"
      style={{ backgroundColor: `${hex}26`, borderColor: `${hex}59`, color: hex }}
    >
      {name}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const t = useTranslations('paymentStatus');
  const map: Record<string, { label: string; hex: string }> = {
    open: { label: t('open'), hex: '#C4453A' },
    partial: { label: t('partial'), hex: '#C97A22' },
    paid: { label: t('paid'), hex: '#2F8F5B' },
  };
  const entry = map[status] ?? { label: status, hex: '#3C4C54' };
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold"
      style={{ backgroundColor: `${entry.hex}26`, borderColor: `${entry.hex}59`, color: entry.hex }}
    >
      {entry.label}
    </span>
  );
}
