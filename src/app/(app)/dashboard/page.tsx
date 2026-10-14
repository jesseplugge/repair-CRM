import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { formatEuro } from '@/lib/utils/currency';
import { getNotifications } from '@/lib/actions/notifications';
import { Plus } from 'lucide-react';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const supabase = createClient();
  const t = await getTranslations('dashboard');

  const locale = await getLocale();

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
        'id, repair_number, status_id, payment_status, final_price, date_received, date_completed, repair_type_label, customer:customers(first_name, last_name), device:devices(brand, model)'
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

  // The bench: every status a repair still moves through, in workflow order, with
  // "Gereed" pulled out as its own column because those go back over the counter.
  // Finished statuses (picked up, cancelled) only get a count.
  const readyStatusId = byName('Gereed')?.id;
  const benchColumns = allStatuses
    .filter((s) => s.active && !s.is_terminal)
    .map((status) => ({ status, repairs: allRepairs.filter((r) => r.status_id === status.id) }));
  const workColumns = benchColumns.filter((c) => c.status.id !== readyStatusId);
  const readyColumn = benchColumns.find((c) => c.status.id === readyStatusId);
  const openCount = benchColumns.reduce((sum, c) => sum + c.repairs.length, 0);
  const finishedCounts = allStatuses
    .filter((s) => s.active && s.is_terminal)
    .map((status) => ({ status, count: allRepairs.filter((r) => r.status_id === status.id).length }));
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

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-950 first-letter:uppercase">{todayLabel}</h1>
          <p className="mt-1 text-sm text-ink-600">{user ? t('welcomeBackName', { name: user.full_name }) : t('welcomeBack')}</p>
        </div>
        <Link
          href="/reparaties/nieuw"
          className="focus-ring inline-flex items-center gap-2 rounded bg-signal-500 px-4 py-2.5 text-sm font-semibold text-ink-950 hover:bg-signal-600"
        >
          <Plus size={18} strokeWidth={2.5} />
          {t('quickNewRepair')}
        </Link>
      </header>

      {/* The bench. On phones it comes after "Today" and scrolls sideways. */}
      <section aria-labelledby="bench-heading" className="order-2 lg:order-1">
        <h2 id="bench-heading" className="mb-3 font-display text-lg font-semibold text-ink-950">
          {t('onTheBench', { count: openCount })}
        </h2>
        <div className="flex gap-px overflow-x-auto rounded-lg bg-mat-700 shadow-crafted">
          {workColumns.map(({ status, repairs }) => (
            <BenchColumn key={status.id} status={status} repairs={repairs} moreLabel={(n) => t('moreInColumn', { count: n })} />
          ))}
          {readyColumn && (
            <BenchColumn
              status={readyColumn.status}
              repairs={readyColumn.repairs}
              moreLabel={(n) => t('moreInColumn', { count: n })}
              ready
            />
          )}
        </div>
        {openCount === 0 && <p className="mt-3 text-sm text-ink-600">{t('benchEmpty')}</p>}
        {finishedCounts.length > 0 && (
          <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-600">
            {finishedCounts.map(({ status, count }) => (
              <Link key={status.id} href={`/reparaties?status=${status.id}`} className="focus-ring rounded hover:text-ink-950">
                {status.name} <span className="tabular-nums font-semibold text-ink-900">{count}</span>
              </Link>
            ))}
          </p>
        )}
      </section>

      <div className="order-1 grid gap-8 lg:order-2 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        {/* Today */}
        <section aria-labelledby="today-heading">
          <h2 id="today-heading" className="mb-3 font-display text-lg font-semibold text-ink-950">
            {t('today')}
          </h2>
          <div className="font-display text-4xl font-bold tabular-nums text-ink-950">{formatEuro(revenueToday)}</div>
          <div className="text-sm text-ink-600">{t('revenueToday')}</div>
          <dl className="mt-4 divide-y divide-ink-200 border-y border-ink-200 text-sm">
            <TodayRow label={t('transactionsToday')} value={transactionsToday} />
            <TodayRow label={t('receivedToday')} value={receivedToday} />
            <TodayRow label={t('outstandingPayments')} value={unpaid} />
          </dl>
        </section>

        <div className="space-y-8">
          {needsAttention.length > 0 && (
            <section aria-labelledby="attention-heading">
              <h2 id="attention-heading" className="mb-3 font-display text-lg font-semibold text-ink-950">
                {t('needsAttention')}
              </h2>
              <ul className="divide-y divide-ink-200 border-y border-ink-200">
                {needsAttention.slice(0, 8).map((item) => (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      className="focus-ring flex items-center gap-3 py-2.5 text-sm text-ink-800 hover:text-ink-950 hover:underline"
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
              <h2 id="insights-heading" className="mb-2 font-display text-lg font-semibold text-ink-950">
                {t('insights')}
              </h2>
              <div className="max-w-prose space-y-1.5 text-sm text-ink-700">
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
        </div>
      </div>
    </div>
  );
}

type BenchRepair = {
  id: string;
  repair_number: string;
  customer: unknown;
  device: unknown;
};

const TAGS_PER_COLUMN = 4;

function BenchColumn({
  status,
  repairs,
  moreLabel,
  ready = false,
}: {
  status: { id: string; name: string; color: string | null };
  repairs: BenchRepair[];
  moreLabel: (count: number) => string;
  ready?: boolean;
}) {
  const hidden = repairs.length - TAGS_PER_COLUMN;
  return (
    <div className={`flex min-w-[10.5rem] flex-1 flex-col bg-mat p-3 ${ready ? 'border-t-4 border-signal-500' : 'border-t-4 border-transparent'}`}>
      <Link
        href={`/reparaties?status=${status.id}`}
        className="focus-ring mb-3 flex items-baseline justify-between gap-2 rounded text-sm text-ink-200 hover:text-white"
      >
        <span className="flex items-center gap-2">
          <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ background: status.color ?? '#6C7D84' }} />
          {status.name}
        </span>
        <span
          className={`font-display text-2xl font-bold tabular-nums ${
            repairs.length === 0 ? 'text-ink-600' : ready ? 'text-signal-500' : 'text-white'
          }`}
        >
          {repairs.length}
        </span>
      </Link>
      <div className="space-y-2">
        {repairs.slice(0, TAGS_PER_COLUMN).map((r) => {
          const customer = r.customer as { first_name: string; last_name: string } | null;
          const device = r.device as { brand: string; model: string } | null;
          return (
            <Link
              key={r.id}
              href={`/reparaties/${r.id}`}
              className={`focus-ring relative block rounded-sm py-2 pl-7 pr-2.5 text-sm ${
                ready ? 'bg-signal-500 text-ink-950 hover:bg-signal-100' : 'bg-ink-50 text-ink-900 hover:bg-white'
              }`}
            >
              {/* the punched hole of a job tag */}
              <span aria-hidden className="absolute left-2.5 top-3 h-2 w-2 rounded-full bg-mat" />
              <span className="block font-display text-xs font-semibold tabular-nums">{r.repair_number}</span>
              {device && <span className="block truncate font-medium">{`${device.brand} ${device.model}`}</span>}
              {customer && <span className="block truncate text-xs opacity-75">{`${customer.first_name} ${customer.last_name}`}</span>}
            </Link>
          );
        })}
        {hidden > 0 && (
          <Link href={`/reparaties?status=${status.id}`} className="focus-ring block rounded px-1 text-xs text-ink-200 hover:text-white">
            {moreLabel(hidden)}
          </Link>
        )}
      </div>
    </div>
  );
}

function TodayRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between py-2">
      <dt className="text-ink-600">{label}</dt>
      <dd className="tabular-nums font-semibold text-ink-950">{value}</dd>
    </div>
  );
}
