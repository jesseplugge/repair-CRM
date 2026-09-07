'use client';

import { useTranslations } from 'next-intl';

export function StatusBadge({ name, color }: { name: string; color: string | null }) {
  const hex = color ?? '#495164';
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: `${hex}1a`, color: hex }}
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
  const entry = map[status] ?? { label: status, hex: '#495164' };
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: `${entry.hex}1a`, color: entry.hex }}
    >
      {entry.label}
    </span>
  );
}
