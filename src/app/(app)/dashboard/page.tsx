import Link from 'next/link';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { Card } from '@/components/ui/primitives';
import { formatEuro } from '@/lib/utils/currency';
import { getNotifications } from '@/lib/actions/notifications';
import { PlusCircle, UserPlus, ShoppingCart, FileText, Search, AlertTriangle, Euro, Clock } from 'lucide-react';

const QUICK_ACTIONS = [
  { href: '/reparaties/nieuw', label: 'Nieuwe reparatie', icon: PlusCircle },
  { href: '/klanten/nieuw', label: 'Nieuwe klant', icon: UserPlus },
  { href: '/kassa', label: 'Verkoop', icon: ShoppingCart },
  { href: '/facturen', label: 'Factuur', icon: FileText },
  { href: '/klanten', label: 'Klant zoeken', icon: Search },
];

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const supabase = createClient();

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
      .select('id, status_id, payment_status, final_price, date_received, date_completed, repair_type_label')
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
  const readyForPickup = allRepairs.filter((r) => r.status_id === byName('Gereed')?.id).length;
  const waitingForParts = allRepairs.filter((r) => r.status_id === byName('Wacht op onderdeel')?.id).length;
  const inProgress = allRepairs.filter((r) => r.status_id === byName('In behandeling')?.id).length;
  const unpaid = allRepairs.filter((r) => r.payment_status !== 'paid').length;

  const paidRepairsToday = allRepairs.filter(
    (r) => r.payment_status === 'paid' && r.date_completed && new Date(r.date_completed) >= startOfToday
  );
  const repairRevenueToday = paidRepairsToday.reduce((sum, r) => sum + (r.final_price ?? 0), 0);
  const posRevenueToday = (posSalesToday ?? []).reduce((sum, s) => sum + s.total_incl_vat, 0);
  const revenueToday = repairRevenueToday + posRevenueToday;
  const transactionsToday = paidRepairsToday.length + (posSalesToday ?? []).length;

  const statusCounts = allStatuses.map((status) => ({
    ...status,
    count: allRepairs.filter((r) => r.status_id === status.id).length,
  }));

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
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-950">Dashboard</h1>
        <p className="text-sm text-ink-600">Welkom terug{user ? `, ${user.full_name}` : ''}.</p>
      </div>

      {/* Today */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">Vandaag</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Ontvangen vandaag" value={receivedToday} />
          <StatCard label="Klaar om op te halen" value={readyForPickup} />
          <StatCard label="Wacht op onderdeel" value={waitingForParts} />
          <StatCard label="In behandeling" value={inProgress} />
          <StatCard label="Openstaande betalingen" value={unpaid} />
          <StatCard label="Omzet vandaag" value={formatEuro(revenueToday)} />
          <StatCard label="Transacties vandaag" value={transactionsToday} />
        </div>
      </section>

      {/* Needs attention */}
      {needsAttention.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-ink-400">
            <AlertTriangle size={14} /> Verdient aandacht
          </h2>
          <Card className="divide-y divide-ink-100">
            {needsAttention.slice(0, 8).map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-700 transition-colors hover:bg-ink-50"
              >
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </Link>
            ))}
          </Card>
        </section>
      )}

      {/* Insights */}
      {(monthDelta !== null || topMarginType) && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">Inzichten</h2>
          <div className="grid grid-cols-2 gap-4">
            {monthDelta !== null && (
              <Card className="flex items-start gap-3 p-4">
                <Clock size={18} className="mt-0.5 text-[var(--accent)]" />
                <p className="text-sm text-ink-700">
                  Je hebt <span className="font-semibold">{completedThisMonth}</span> reparaties afgerond deze
                  maand, {monthDelta >= 0 ? `${monthDelta}% meer` : `${Math.abs(monthDelta)}% minder`} dan vorige
                  maand.
                </p>
              </Card>
            )}
            {topMarginType && (
              <Card className="flex items-start gap-3 p-4">
                <Euro size={18} className="mt-0.5 text-[var(--accent)]" />
                <p className="text-sm text-ink-700">
                  <span className="font-semibold">{topMarginType[0]}</span> heeft deze maand je hoogste marge
                  ({Math.round((topMarginType[1].profit / topMarginType[1].revenue) * 100)}%).
                </p>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* Quick actions */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">Snel starten</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {QUICK_ACTIONS.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <Card className="flex flex-col items-center gap-2 px-4 py-6 text-center transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]">
                <Icon size={22} className="text-[var(--accent)]" />
                <span className="text-sm font-medium text-ink-900">{label}</span>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Status overview */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">Reparatiestatus</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statusCounts.map((status) => (
            <Link key={status.id} href={`/reparaties?status=${status.id}`}>
              <Card className="px-4 py-4 transition-colors hover:border-[var(--accent)]">
                <div className="text-2xl font-display font-semibold tabular-nums text-ink-950">{status.count}</div>
                <div className="mt-1 text-sm" style={{ color: status.color ?? undefined }}>
                  {status.name}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="px-4 py-4">
      <div className="text-2xl font-display font-semibold tabular-nums text-ink-950">{value}</div>
      <div className="mt-1 text-sm text-ink-600">{label}</div>
    </Card>
  );
}
