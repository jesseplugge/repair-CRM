import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { formatEuro } from '@/lib/utils/currency';
import { getNotifications } from '@/lib/actions/notifications';
import { FileText, Plus, Search, ShoppingCart, UserPlus, ShieldAlert, Clock, PackageX, Receipt, type LucideIcon } from 'lucide-react';
import { JobBoard, type JobRowData } from './JobBoard';
import { KpiTile, KpiStrip } from '@/components/ui/kpi-tile';
import { Button } from '@/components/ui/primitives';

const NOTIFICATION_ICON: Record<string, { icon: LucideIcon; className: string }> = {
  claim: { icon: ShieldAlert, className: 'text-danger-600' },
  ready: { icon: Clock, className: 'text-signal-600' },
  stock: { icon: PackageX, className: 'text-warning-600' },
  inv: { icon: Receipt, className: 'text-danger-600' },
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const supabase = createClient();
  const t = await getTranslations('dashboard');

  const locale = await getLocale();

  const SHORTCUTS = [
    { href: '/kassa', label: t('quickSale'), icon: ShoppingCart },
    { href: '/klanten/nieuw', label: t('quickNewCustomer'), icon: UserPlus },
    { href: '/klanten', label: t('quickFindCustomer'), icon: Search },
    { href: '/facturen', label: t('quickInvoice'), icon: FileText },
  ];

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: statuses }, { data: repairs }, { data: posSalesToday }, { data: tipPaymentsToday }, needsAttention] = await Promise.all([
    supabase.from('repair_statuses').select('*').eq('business_id', user!.business_id).order('sort_order'),
    supabase
      .from('repairs')
      .select(
        'id, repair_number, status_id, payment_status, final_price, date_received, date_completed, expected_completion_date, repair_type_label, customer:customers(first_name, last_name, phone), device:devices(brand, model)'
      )
      .order('date_received')
      .eq('business_id', user!.business_id),
    supabase
      .from('pos_sales')
      .select('total_incl_vat')
      .eq('business_id', user!.business_id)
      .eq('status', 'paid')
      .gte('created_at', startOfToday.toISOString()),
    // Tips run through the till as taxable turnover here, not a pass-through gratuity — counted the same as any other revenue.
    supabase.from('payments').select('tip_amount').eq('business_id', user!.business_id).gte('paid_at', startOfToday.toISOString()),
    getNotifications(),
  ]);

  const allRepairs = repairs ?? [];
  const allStatuses = statuses ?? [];
  const byName = (name: string) => allStatuses.find((s) => s.name === name);

  const receivedToday = allRepairs.filter((r) => new Date(r.date_received) >= startOfToday).length;
  const unpaid = allRepairs.filter((r) => r.payment_status !== 'paid').length;

  const paidRepairsToday = allRepairs.filter(
    (r) => r.payment_status === 'paid' && r.date_completed && new Date(r.date_completed) >= startOfToday
  );
  const repairRevenueToday = paidRepairsToday.reduce((sum, r) => sum + (r.final_price ?? 0), 0);
  const posRevenueToday = (posSalesToday ?? []).reduce((sum, s) => sum + s.total_incl_vat, 0);
  const tipRevenueToday = (tipPaymentsToday ?? []).reduce((sum, p) => sum + (p.tip_amount ?? 0), 0);
  const revenueToday = repairRevenueToday + posRevenueToday + tipRevenueToday;
  const transactionsToday = paidRepairsToday.length + (posSalesToday ?? []).length;

  // Open repairs as one list, not columns: what can go back over the counter first,
  // then everything still on the bench, oldest first. Finished statuses (picked up,
  // cancelled) only get a count.
  const readyStatusId = byName('Gereed')?.id;
  const statusById = new Map(allStatuses.map((s) => [s.id, s]));
  const openRepairs = allRepairs.filter((r) => {
    const status = statusById.get(r.status_id);
    return status && !status.is_terminal;
  });
  const finishedCounts = allStatuses
    .filter((s) => s.active && s.is_terminal)
    .map((status) => ({ status, count: allRepairs.filter((r) => r.status_id === status.id).length }));
  const daysInShop = (received: string) => Math.max(0, Math.floor((startOfToday.getTime() - new Date(received).setHours(0, 0, 0, 0)) / 86_400_000));
  const isOverdue = (expected: string | null) => !!expected && new Date(expected) < startOfToday;
  const todayLabel = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(now);

  // Insight: completed repairs this month vs last month
  const completedThisMonth = allRepairs.filter((r) => r.date_completed && new Date(r.date_completed) >= startOfMonth).length;
  const completedLastMonth = allRepairs.filter(
    (r) => r.date_completed && new Date(r.date_completed) >= startOfLastMonth && new Date(r.date_completed) < startOfMonth
  ).length;
  const monthDelta = completedLastMonth > 0 ? Math.round(((completedThisMonth - completedLastMonth) / completedLastMonth) * 100) : null;

  // Insight: highest-margin repair type this month
  const paidThisMonthIds = allRepairs
    .filter((r) => r.payment_status === 'paid' && r.date_completed && new Date(r.date_completed) >= startOfMonth)
    .map((r) => r.id);
  const { data: repairItemsThisMonth } = paidThisMonthIds.length
    ? await supabase.from('repair_items').select('description, selling_price_excl_vat, cost_price_excl_vat, quantity').in('repair_id', paidThisMonthIds)
    : { data: [] as { description: string; selling_price_excl_vat: number; cost_price_excl_vat: number | null; quantity: number }[] };

  const marginByType = new Map<string, { profit: number; revenue: number }>();
  for (const row of repairItemsThisMonth ?? []) {
    const label = row.description;
    const revenue = row.selling_price_excl_vat * row.quantity;
    const cost = (row.cost_price_excl_vat ?? 0) * row.quantity;
    const entry = marginByType.get(label) ?? { profit: 0, revenue: 0 };
    entry.profit += revenue - cost;
    entry.revenue += revenue;
    marginByType.set(label, entry);
  }
  const topMarginType = [...marginByType.entries()]
    .filter(([, v]) => v.revenue > 0)
    .sort((a, b) => b[1].profit / b[1].revenue - a[1].profit / a[1].revenue)[0];

  // Ranked as one list, most urgent first: ready for pickup or past its expected date
  // (needs a hand now), then everything else still on the bench, oldest-received first.
  const isUrgent = (r: (typeof openRepairs)[number]) => r.status_id === readyStatusId || isOverdue(r.expected_completion_date);
  const urgentRepairs = openRepairs.filter(isUrgent);
  const normalRepairs = openRepairs.filter((r) => !isUrgent(r));
  const rankedRepairs = [...urgentRepairs, ...normalRepairs];
  const visibleRepairs = rankedRepairs.slice(0, LIST_LIMIT);
  const hiddenCount = rankedRepairs.length - visibleRepairs.length;

  const toRow = (r: (typeof openRepairs)[number]): JobRowData => {
    const customer = r.customer as unknown as { first_name: string; last_name: string; phone: string | null } | null;
    const device = r.device as unknown as { brand: string; model: string } | null;
    const status = statusById.get(r.status_id);
    const days = daysInShop(r.date_received);
    return {
      id: r.id,
      repairNumber: r.repair_number,
      device: device ? `${device.brand} ${device.model}` : (r.repair_type_label ?? ''),
      customer: customer ? `${customer.first_name} ${customer.last_name}` : '',
      phone: customer?.phone ?? null,
      days,
      daysText: t('daysInShop', { count: days }),
      overdue: isOverdue(r.expected_completion_date),
      urgent: isUrgent(r),
      statusName: status?.name ?? '',
      statusColor: status?.color ?? null,
      amountText: r.final_price != null ? formatEuro(r.final_price) : null,
    };
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-950 first-letter:uppercase">{todayLabel}</h1>
          <p className="mt-2 max-w-prose text-base text-ink-700">
            {t('todaySentence', { revenue: formatEuro(revenueToday), transactions: transactionsToday })}{' '}
            {t('todaySentenceRepairs', { received: receivedToday, unpaid })}
          </p>
        </div>
        <nav aria-label={t('quickStart')} className="flex flex-wrap items-center gap-2">
          {SHORTCUTS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="focus-ring inline-flex items-center gap-2 rounded border border-ink-200 bg-white px-3 py-2.5 text-sm font-medium text-ink-900 hover:border-ink-400"
            >
              <Icon size={16} className="text-ink-600" />
              {label}
            </Link>
          ))}
          <Link href="/reparaties/nieuw">
            <Button variant="signal">
              <Plus size={18} strokeWidth={2.5} />
              {t('quickNewRepair')}
            </Button>
          </Link>
        </nav>
      </header>

      <KpiStrip>
        <KpiTile label={t('kpiOpenRepairs')} value={openRepairs.length} />
        <KpiTile label={t('kpiNeedsAction')} value={urgentRepairs.length} emphasize={urgentRepairs.length > 0} />
        <KpiTile label={t('revenueToday')} value={formatEuro(revenueToday)} />
        <KpiTile label={t('outstandingPayments')} value={unpaid} emphasize={unpaid > 0} />
      </KpiStrip>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
        <div className="space-y-10">
          <section aria-labelledby="bench-heading">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="bench-heading" className="font-display text-lg font-semibold text-ink-950">
                {t('benchHeading')} <span className="font-mono tabular-nums text-ink-600">{openRepairs.length}</span>
              </h2>
              <Link href="/reparaties" className="focus-ring rounded text-sm text-[var(--accent)] hover:underline">
                {t('allRepairs')}
              </Link>
            </div>
            {openRepairs.length === 0 ? (
              <p className="mt-2 rounded-lg border border-ink-100 py-4 text-center text-sm text-ink-600">{t('benchEmpty')}</p>
            ) : (
              <div className="mt-2 rounded-lg border border-ink-100">
                <JobBoard
                  rows={visibleRepairs.map(toRow)}
                  ticketLabels={{
                    claim: t('ticketClaim'),
                    device: t('ticketDevice'),
                    status: t('ticketStatus'),
                    daysInShop: t('daysInShop', { count: 1 }),
                    amount: t('ticketAmount'),
                    call: t('call'),
                    open: t('ticketOpen'),
                  }}
                />
              </div>
            )}
            {hiddenCount > 0 && (
              <Link href="/reparaties" className="focus-ring mt-2 inline-block rounded text-sm text-[var(--accent)] hover:underline">
                {t('moreRepairs', { count: hiddenCount })}
              </Link>
            )}
            {finishedCounts.length > 0 && (
              <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-600">
                {finishedCounts.map(({ status, count }) => (
                  <Link key={status.id} href={`/reparaties?status=${status.id}`} className="focus-ring rounded hover:text-ink-950">
                    {status.name} <span className="font-mono tabular-nums font-semibold text-ink-900">{count}</span>
                  </Link>
                ))}
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-10">
          {needsAttention.length > 0 && (
            <section aria-labelledby="attention-heading">
              <h2 id="attention-heading" className="font-display text-lg font-semibold text-ink-950">
                {t('needsAttention')}
              </h2>
              <ul className="mt-2 divide-y divide-ink-200 border-y border-ink-200">
                {needsAttention.slice(0, 8).map((item) => {
                  const prefix = item.key.split('-')[0];
                  const { icon: Icon, className } = NOTIFICATION_ICON[prefix] ?? { icon: ShieldAlert, className: 'text-ink-500' };
                  return (
                    <li key={item.key}>
                      <Link
                        href={item.href}
                        className="focus-ring flex items-start gap-3 py-2.5 text-sm text-ink-800 hover:text-ink-950 hover:underline"
                      >
                        <Icon size={16} className={`mt-0.5 shrink-0 ${className}`} aria-hidden />
                        <span>{item.text}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {(monthDelta !== null || topMarginType) && (
            <section aria-labelledby="insights-heading">
              <h2 id="insights-heading" className="font-display text-lg font-semibold text-ink-950">
                {t('insights')}
              </h2>
              <div className="mt-2 space-y-2 text-sm leading-relaxed text-ink-700">
                {monthDelta !== null && (
                  <p>
                    {monthDelta >= 0
                      ? t('insightCompletedThisMonthMore', { count: completedThisMonth, percent: monthDelta })
                      : t('insightCompletedThisMonthLess', { count: completedThisMonth, percent: Math.abs(monthDelta) })}
                  </p>
                )}
                {topMarginType && (
                  <p>
                    {t('insightTopMargin', {
                      type: topMarginType[0],
                      percent: Math.round((topMarginType[1].profit / topMarginType[1].revenue) * 100),
                    })}
                  </p>
                )}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

const LIST_LIMIT = 12;
