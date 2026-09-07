import Link from 'next/link';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { Card } from '@/components/ui/primitives';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate } from '@/lib/utils/format';

const STATUS_META: Record<string, { label: string; color: string }> = {
  new: { label: 'Nieuw', color: '#4C5FD5' },
  investigating: { label: 'Onderzoek', color: '#C97A22' },
  approved: { label: 'Goedgekeurd', color: '#0C7C82' },
  rejected: { label: 'Afgewezen', color: '#C4453A' },
  repairing: { label: 'In reparatie', color: '#C97A22' },
  resolved: { label: 'Afgehandeld', color: '#2F8F5B' },
};

export default async function GarantiePage() {
  const user = await getCurrentUser();
  const supabase = createClient();

  const { data: claims } = await supabase
    .from('warranty_claims')
    .select('*, repair:repairs(id, repair_number, customer:customers(first_name, last_name), device:devices(brand, model))')
    .eq('business_id', user!.business_id)
    .order('created_at', { ascending: false });

  const open = (claims ?? []).filter((c) => c.status !== 'resolved' && c.status !== 'rejected');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-950">Garantie</h1>
        <p className="text-sm text-ink-600">{open.length} openstaande garantieclaim(s)</p>
      </div>

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400">
              <th className="px-4 py-3 font-medium">Claim</th>
              <th className="px-4 py-3 font-medium">Reparatie</th>
              <th className="px-4 py-3 font-medium">Klant</th>
              <th className="px-4 py-3 font-medium">Apparaat</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Datum</th>
            </tr>
          </thead>
          <tbody>
            {(claims ?? []).map((c) => {
              const repair = c.repair as any;
              const customer = repair?.customer;
              const device = repair?.device;
              const meta = STATUS_META[c.status] ?? { label: c.status, color: '#495164' };
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
                    <StatusBadge name={meta.label} color={meta.color} />
                  </td>
                  <td className="px-4 py-3 text-ink-600">{formatDate(c.created_at)}</td>
                </tr>
              );
            })}
            {(claims ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink-400">
                  Nog geen garantieclaims. Claims worden aangemaakt vanuit een reparatie.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
