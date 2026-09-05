import Link from 'next/link';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { Card } from '@/components/ui/primitives';
import { formatEuro } from '@/lib/utils/currency';
import { PlusCircle, UserPlus, ShoppingCart, FileText, Search } from 'lucide-react';

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

  const [{ data: statuses }, { data: repairs }] = await Promise.all([
    supabase.from('repair_statuses').select('*').eq('business_id', user!.business_id).order('sort_order'),
    supabase
      .from('repairs')
      .select('id, status_id, payment_status, final_price, date_received, date_completed')
      .eq('business_id', user!.business_id),
  ]);

  const allRepairs = repairs ?? [];
  const allStatuses = statuses ?? [];
  const byName = (name: string) => allStatuses.find((s) => s.name === name);

  const receivedToday = allRepairs.filter((r) => new Date(r.date_received) >= startOfToday).length;
  const readyForPickup = allRepairs.filter((r) => r.status_id === byName('Gereed')?.id).length;
  const waitingForParts = allRepairs.filter((r) => r.status_id === byName('Wacht op onderdeel')?.id).length;
  const inProgress = allRepairs.filter((r) => r.status_id === byName('In behandeling')?.id).length;
  const unpaid = allRepairs.filter((r) => r.payment_status !== 'paid').length;

  const paidToday = allRepairs.filter(
    (r) => r.payment_status === 'paid' && r.date_completed && new Date(r.date_completed) >= startOfToday
  );
  const revenueToday = paidToday.reduce((sum, r) => sum + (r.final_price ?? 0), 0);

  const statusCounts = allStatuses.map((status) => ({
    ...status,
    count: allRepairs.filter((r) => r.status_id === status.id).length,
  }));

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
          <StatCard label="Transacties vandaag" value={paidToday.length} />
        </div>
        <p className="mt-2 text-xs text-ink-400">
          Omzet- en transactiecijfers zijn gebaseerd op afgeronde, betaalde reparaties. Kassa- en factuurverkopen
          tellen mee zodra de Kassa-module live is.
        </p>
      </section>

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
