import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { Card } from '@/components/ui/primitives';
import { Table, Thead, Tbody, Th, Td } from '@/components/ui/table';
import { ClickableTr } from '@/components/ui/clickable-tr';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge, PaymentStatusBadge } from '@/components/StatusBadge';
import { KpiTile, KpiStrip } from '@/components/ui/kpi-tile';
import { formatDate } from '@/lib/utils/format';
import { formatEuro } from '@/lib/utils/currency';
import { Plus, List, Kanban, Wrench } from 'lucide-react';
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
      'id, repair_number, repair_type_label, estimated_price, final_price, payment_status, date_received, expected_completion_date, status:repair_statuses(id, name, color), customer:customers(first_name, last_name), device:devices(brand, model)'
    )
    .eq('business_id', user!.business_id)
    .order('date_received', { ascending: false });

  if (searchParams.status) query = query.eq('status_id', searchParams.status);

  const { data: repairs } = await query;
  const allRepairs = repairs ?? [];

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const daysInShop = (received: string) => Math.max(0, Math.floor((startOfToday.getTime() - new Date(received).setHours(0, 0, 0, 0)) / 86_400_000));
  const isOverdue = (expected: string | null) => !!expected && new Date(expected) < startOfToday;

  const unpaidCount = allRepairs.filter((r) => r.payment_status !== 'paid').length;
  const overdueCount = allRepairs.filter((r) => isOverdue(r.expected_completion_date)).length;
  const totalAmount = allRepairs.reduce((sum, r) => sum + (r.final_price ?? r.estimated_price ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-950">{t('title')}</h1>
          <p className="text-sm text-ink-600">{t('count', { count: allRepairs.length })}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
          <Link
            href="/reparaties/nieuw"
            className="focus-ring inline-flex items-center gap-2 rounded px-3.5 py-2 text-sm font-semibold bg-signal-500 text-white hover:bg-signal-600"
          >
            <Plus size={16} /> {t('newRepair')}
          </Link>
        </div>
      </div>

      <KpiStrip>
        <KpiTile label={t('kpiTotal')} value={allRepairs.length} />
        <KpiTile label={t('kpiUnpaid')} value={unpaidCount} emphasize={unpaidCount > 0} />
        <KpiTile label={t('kpiAmount')} value={formatEuro(totalAmount)} />
        <KpiTile label={t('kpiOverdue')} value={overdueCount} emphasize={overdueCount > 0} />
      </KpiStrip>

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
        <ReparatiesKanban statuses={statuses ?? []} repairs={allRepairs as any} />
      ) : allRepairs.length === 0 ? (
        <Card>
          <EmptyState icon={Wrench} title={t('empty')} />
        </Card>
      ) : (
        <>
          <Card className="hidden md:block">
            <Table>
              <Thead>
                <tr>
                  <Th>{t('colNumber')}</Th>
                  <Th>{t('colCustomer')}</Th>
                  <Th>{t('colDevice')}</Th>
                  <Th>{t('colType')}</Th>
                  <Th>{t('colDays')}</Th>
                  <Th>{t('colStatus')}</Th>
                  <Th>{t('colPayment')}</Th>
                  <Th align="right">{t('colAmount')}</Th>
                </tr>
              </Thead>
              <Tbody>
                {allRepairs.map((r: any) => {
                  const overdue = isOverdue(r.expected_completion_date);
                  return (
                    <ClickableTr key={r.id} href={`/reparaties/${r.id}`}>
                      <Td>
                        <Link href={`/reparaties/${r.id}`} className="font-mono font-medium text-[var(--accent)] hover:underline">
                          {r.repair_number}
                        </Link>
                      </Td>
                      <Td className="text-ink-700">
                        {r.customer?.first_name} {r.customer?.last_name}
                      </Td>
                      <Td className="text-ink-600">
                        {r.device?.brand} {r.device?.model}
                      </Td>
                      <Td className="text-ink-600">{r.repair_type_label ?? '—'}</Td>
                      <Td className={`font-mono tabular-nums font-semibold ${overdue ? 'text-danger-600' : 'text-ink-900'}`}>
                        {daysInShop(r.date_received)}
                      </Td>
                      <Td>{r.status && <StatusBadge name={r.status.name} color={r.status.color} />}</Td>
                      <Td>
                        <PaymentStatusBadge status={r.payment_status} />
                      </Td>
                      <Td align="right" className="font-mono tabular-nums text-ink-900">
                        {formatEuro(r.final_price ?? r.estimated_price)}
                      </Td>
                    </ClickableTr>
                  );
                })}
              </Tbody>
            </Table>
          </Card>

          <div className="space-y-2 md:hidden">
            {allRepairs.map((r: any) => {
              const overdue = isOverdue(r.expected_completion_date);
              return (
                <Link
                  key={r.id}
                  href={`/reparaties/${r.id}`}
                  className="flex items-start gap-3 rounded-lg border border-ink-100 bg-white p-3 shadow-card"
                >
                  <div className={`w-10 shrink-0 text-right font-mono text-xl font-bold tabular-nums ${overdue ? 'text-danger-600' : 'text-ink-950'}`}>
                    {daysInShop(r.date_received)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate font-mono font-medium text-[var(--accent)]">{r.repair_number}</span>
                      <span className="shrink-0 font-mono tabular-nums font-medium text-ink-900">
                        {formatEuro(r.final_price ?? r.estimated_price)}
                      </span>
                    </div>
                    <div className="mt-0.5 break-words text-sm text-ink-700">
                      {r.customer?.first_name} {r.customer?.last_name}
                    </div>
                    <div className="break-words text-xs text-ink-400">
                      {r.device?.brand} {r.device?.model}
                      {r.repair_type_label ? ` · ${r.repair_type_label}` : ''} · {formatDate(r.date_received)}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {r.status && <StatusBadge name={r.status.name} color={r.status.color} />}
                      <PaymentStatusBadge status={r.payment_status} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
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
