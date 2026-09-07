import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { Card, Button } from '@/components/ui/primitives';
import { StatusBadge, PaymentStatusBadge } from '@/components/StatusBadge';
import { formatDate } from '@/lib/utils/format';
import { formatEuro } from '@/lib/utils/currency';
import { Plus, List, Kanban } from 'lucide-react';
import { ReparatiesKanban } from './ReparatiesKanban';

export default async function ReparatiesPage({ searchParams }: { searchParams: { status?: string; view?: string } }) {
  const user = await getCurrentUser();
  const supabase = createClient();
  const t = await getTranslations('repairsList');
  const view = searchParams.view === 'kanban' ? 'kanban' : 'list';

  const { data: statuses } = await supabase
    .from('repair_statuses')
    .select('*')
    .eq('business_id', user!.business_id)
    .eq('active', true)
    .order('sort_order');

  let query = supabase
    .from('repairs')
    .select(
      'id, repair_number, repair_type_label, estimated_price, final_price, payment_status, date_received, status:repair_statuses(id, name, color), customer:customers(first_name, last_name), device:devices(brand, model)'
    )
    .eq('business_id', user!.business_id)
    .order('date_received', { ascending: false });

  if (searchParams.status) query = query.eq('status_id', searchParams.status);

  const { data: repairs } = await query;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-950">{t('title')}</h1>
          <p className="text-sm text-ink-600">{t('count', { count: repairs?.length ?? 0 })}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded border border-ink-200 bg-white p-0.5">
            <Link
              href={{ pathname: '/reparaties', query: { ...(searchParams.status ? { status: searchParams.status } : {}), view: 'list' } }}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm ${view === 'list' ? 'bg-ink-100 text-ink-900' : 'text-ink-500'}`}
            >
              <List size={14} /> {t('list')}
            </Link>
            <Link
              href={{ pathname: '/reparaties', query: { ...(searchParams.status ? { status: searchParams.status } : {}), view: 'kanban' } }}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm ${view === 'kanban' ? 'bg-ink-100 text-ink-900' : 'text-ink-500'}`}
            >
              <Kanban size={14} /> {t('kanban')}
            </Link>
          </div>
          <Link href="/reparaties/nieuw">
            <Button variant="primary">
              <Plus size={16} /> {t('newRepair')}
            </Button>
          </Link>
        </div>
      </div>

      {view === 'list' && (
        <div className="flex flex-wrap gap-2">
          <Link href="/reparaties">
            <FilterChip active={!searchParams.status} label={t('all')} />
          </Link>
          {(statuses ?? []).map((s) => (
            <Link key={s.id} href={`/reparaties?status=${s.id}`}>
              <FilterChip active={searchParams.status === s.id} label={s.name} color={s.color} />
            </Link>
          ))}
        </div>
      )}

      {view === 'kanban' ? (
        <ReparatiesKanban statuses={statuses ?? []} repairs={(repairs ?? []) as any} />
      ) : (
      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400">
              <th className="px-4 py-3 font-medium">{t('colNumber')}</th>
              <th className="px-4 py-3 font-medium">{t('colCustomer')}</th>
              <th className="px-4 py-3 font-medium">{t('colDevice')}</th>
              <th className="px-4 py-3 font-medium">{t('colType')}</th>
              <th className="px-4 py-3 font-medium">{t('colReceived')}</th>
              <th className="px-4 py-3 font-medium">{t('colStatus')}</th>
              <th className="px-4 py-3 font-medium">{t('colPayment')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('colAmount')}</th>
            </tr>
          </thead>
          <tbody>
            {(repairs ?? []).map((r: any) => (
              <tr key={r.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50">
                <td className="px-4 py-3">
                  <Link href={`/reparaties/${r.id}`} className="font-medium text-[var(--accent)] hover:underline">
                    {r.repair_number}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-700">
                  {r.customer?.first_name} {r.customer?.last_name}
                </td>
                <td className="px-4 py-3 text-ink-600">
                  {r.device?.brand} {r.device?.model}
                </td>
                <td className="px-4 py-3 text-ink-600">{r.repair_type_label ?? '—'}</td>
                <td className="px-4 py-3 text-ink-600">{formatDate(r.date_received)}</td>
                <td className="px-4 py-3">{r.status && <StatusBadge name={r.status.name} color={r.status.color} />}</td>
                <td className="px-4 py-3">
                  <PaymentStatusBadge status={r.payment_status} />
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-ink-900">
                  {formatEuro(r.final_price ?? r.estimated_price)}
                </td>
              </tr>
            ))}
            {(repairs ?? []).length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-ink-400">
                  {t('empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
      )}
    </div>
  );
}

function FilterChip({ active, label, color }: { active: boolean; label: string; color?: string | null }) {
  return (
    <span
      className={`inline-flex cursor-pointer items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50'
      }`}
    >
      {label}
    </span>
  );
}
