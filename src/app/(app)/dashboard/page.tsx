import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { formatEuro } from '@/lib/utils/currency';
import { getNotifications } from '@/lib/actions/notifications';
import { FileText, Phone, Plus, Search, ShoppingCart, UserPlus } from 'lucide-react';

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

  const [{ data: statuses }, { data: repairs }, { data: posSalesToday }, needsAttention] = await Promise.all([
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
  const revenueToday = repairRevenueToday + posRevenueToday;
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
  const readyRepairs = openRepairs.filter((r) => r.status_id === readyStatusId);
  const benchRepairs = openRepairs.filter((r) => r.status_id !== readyStatusId);
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

  const toRow = (r: (typeof openRepairs)[number]): JobRowData => {
    const customer = r.customer as unknown as { first_name: string; last_name: string; phone: string | null } | null;
    const device = r.device as unknown as { brand: string; model: string } | null;
    const status = statusById.get(r.status_id);
    return {
      id: r.id,
      repairNumber: r.repair_number,
      device: device ? `${device.brand} ${device.model}` : (r.repair_type_label ?? ''),
      customer: customer ? `${customer.first_name} ${customer.last_name}` : '',
      phone: customer?.phone ?? null,
      days: daysInShop(r.date_received),
      overdue: isOverdue(r.expected_completion_date),
      statusName: status?.name ?? '',
      statusColor: status?.color ?? null,
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
          <Link
            href="/reparaties/nieuw"
            className="focus-ring inline-flex items-center gap-2 rounded bg-signal-500 px-4 py-2.5 text-sm font-semibold text-ink-950 hover:bg-signal-600"
          >
            <Plus size={18} strokeWidth={2.5} />
            {t('quickNewRepair')}
          </Link>
        </nav>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
        <div className="space-y-10">
          {readyRepairs.length > 0 && (
            <section aria-labelledby="ready-heading" className="border-l-4 border-signal-500 pl-4">
              <h2 id="ready-heading" className="font-display text-lg font-semibold text-ink-950">
                {t('readyForPickup')} <span className="tabular-nums text-ink-600">{readyRepairs.length}</span>
              </h2>
              <ul className="mt-2 divide-y divide-ink-200">
                {readyRepairs.map((r) => (
                  <JobRow key={r.id} job={toRow(r)} callLabel={t('call')} daysLabel={(n) => t('daysInShop', { count: n })} showCall />
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="bench-heading">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="bench-heading" className="font-display text-lg font-semibold text-ink-950">
                {t('benchHeading')} <span className="tabular-nums text-ink-600">{benchRepairs.length}</span>
              </h2>
              <Link href="/reparaties" className="focus-ring rounded text-sm text-[var(--accent)] hover:underline">
                {t('allRepairs')}
              </Link>
            </div>
            {benchRepairs.length === 0 ? (
              <p className="mt-2 border-y border-ink-200 py-4 text-sm text-ink-600">{t('benchEmpty')}</p>
            ) : (
              <ul className="mt-2 divide-y divide-ink-200 border-y border-ink-200">
                {benchRepairs.slice(0, BENCH_LIMIT).map((r) => (
                  <JobRow key={r.id} job={toRow(r)} callLabel={t('call')} daysLabel={(n) => t('daysInShop', { count: n })} />
                ))}
              </ul>
            )}
            {benchRepairs.length > BENCH_LIMIT && (
              <Link href="/reparaties" className="focus-ring mt-2 inline-block rounded text-sm text-[var(--accent)] hover:underline">
                {t('moreRepairs', { count: benchRepairs.length - BENCH_LIMIT })}
              </Link>
            )}
            {finishedCounts.length > 0 && (
              <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-600">
                {finishedCounts.map(({ status, count }) => (
                  <Link key={status.id} href={`/reparaties?status=${status.id}`} className="focus-ring rounded hover:text-ink-950">
                    {status.name} <span className="tabular-nums font-semibold text-ink-900">{count}</span>
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
                {needsAttention.slice(0, 8).map((item) => (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      className="focus-ring flex items-start gap-3 py-2.5 text-sm text-ink-800 hover:text-ink-950 hover:underline"
                    >
                      <span aria-hidden>{item.icon}</span>
                      <span>{item.text}</span>
                    </Link>
                  </li>
                ))}
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

const BENCH_LIMIT = 10;

type JobRowData = {
  id: string;
  repairNumber: string;
  device: string;
  customer: string;
  phone: string | null;
  days: number;
  overdue: boolean;
  statusName: string;
  statusColor: string | null;
};

/** One open repair. The days-in-shop figure leads the row: it is what the shop manages by. */
function JobRow({
  job,
  callLabel,
  daysLabel,
  showCall = false,
}: {
  job: JobRowData;
  callLabel: string;
  daysLabel: (count: number) => string;
  showCall?: boolean;
}) {
  return (
    <li className="flex items-center gap-4 py-3">
      <div className={`w-14 shrink-0 text-right ${job.overdue ? 'text-danger-600' : 'text-ink-950'}`}>
        <div className="font-display text-3xl font-bold leading-none tabular-nums">{job.days}</div>
        <div className="mt-1 text-xs text-ink-600">{daysLabel(job.days)}</div>
      </div>
      <Link href={`/reparaties/${job.id}`} className="focus-ring group min-w-0 flex-1 rounded">
        <div className="truncate font-medium text-ink-950 group-hover:underline">{job.device}</div>
        <div className="truncate text-sm text-ink-600">
          {job.customer}
          <span className="ml-2 tabular-nums text-ink-400">{job.repairNumber}</span>
        </div>
      </Link>
      {!showCall && (
        <span className="hidden shrink-0 items-center gap-2 text-sm text-ink-700 sm:flex">
          <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: job.statusColor ?? '#6C7D84' }} />
          {job.statusName}
        </span>
      )}
      {showCall && job.phone && (
        <a
          href={`tel:${job.phone.replace(/\s+/g, '')}`}
          className="focus-ring inline-flex shrink-0 items-center gap-1.5 rounded border border-ink-200 bg-white px-3 py-1.5 text-sm font-medium text-ink-900 hover:border-ink-400"
        >
          <Phone size={14} />
          {callLabel}
        </a>
      )}
    </li>
  );
}
