import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { Card } from '@/components/ui/primitives';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate } from '@/lib/utils/format';

const STATUS_KEYS: Record<string, string> = {
  new: 'statusNew',
  investigating: 'statusInvestigating',
  approved: 'statusApproved',
  rejected: 'statusRejected',
  repairing: 'statusRepairing',
  resolved: 'statusResolved',
};
const STATUS_COLORS: Record<string, string> = {
  new: '#4C5FD5',
  investigating: '#C97A22',
  approved: '#0C7C82',
  rejected: '#C4453A',
  repairing: '#C97A22',
  resolved: '#2F8F5B',
};

export default async function GarantiePage() {
  const user = await getCurrentUser();
  const supabase = createClient();
  const t = await getTranslations('warrantyPage');
  const tTabs = await getTranslations('repairTabs');

  const { data: claims } = await supabase
    .from('warranty_claims')
    .select('*, repair:repairs(id, repair_number, customer:customers(first_name, last_name), device:devices(brand, model))')
    .eq('business_id', user!.business_id)
    .order('created_at', { ascending: false });

  const open = (claims ?? []).filter((c) => c.status !== 'resolved' && c.status !== 'rejected');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-950">{t('title')}</h1>
        <p className="text-sm text-ink-600">{t('openCount', { count: open.length })}</p>
      </div>

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400">
              <th className="px-4 py-3 font-medium">{t('colClaim')}</th>
              <th className="px-4 py-3 font-medium">{t('colRepair')}</th>
              <th className="px-4 py-3 font-medium">{t('colCustomer')}</th>
              <th className="px-4 py-3 font-medium">{t('colDevice')}</th>
              <th className="px-4 py-3 font-medium">{t('colStatus')}</th>
              <th className="px-4 py-3 font-medium">{t('colDate')}</th>
            </tr>
          </thead>
          <tbody>
            {(claims ?? []).map((c) => {
              const repair = c.repair as any;
              const customer = repair?.customer;
              const device = repair?.device;
              const label = STATUS_KEYS[c.status] ? tTabs(STATUS_KEYS[c.status] as any) : c.status;
              const color = STATUS_COLORS[c.status] ?? '#495164';
              return (
                <tr key={c.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50">
                  <td className="px-4 py-3 font-medium text-ink-900">{c.claim_number}</td>
                  <td className="px-4 py-3">
                    {repair && (
                      <Link href={`/reparaties/${repair.id}`} className="text-[var(--accent)] hover:underline">
                        {repair.repair_number}
                      </Link>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-700">
                    {customer ? `${customer.first_name} ${customer.last_name}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-ink-600">{device ? `${device.brand} ${device.model}` : '—'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge name={label} color={color} />
                  </td>
                  <td className="px-4 py-3 text-ink-600">{formatDate(c.created_at)}</td>
                </tr>
              );
            })}
            {(claims ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink-400">
                  {t('empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
