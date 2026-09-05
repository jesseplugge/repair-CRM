import Link from 'next/link';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { Card, Button } from '@/components/ui/primitives';
import { formatDate } from '@/lib/utils/format';
import { formatEuro } from '@/lib/utils/currency';
import { Plus } from 'lucide-react';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Concept', color: '#495164' },
  sent: { label: 'Verzonden', color: '#0C7C82' },
  paid: { label: 'Betaald', color: '#2F8F5B' },
  partially_paid: { label: 'Gedeeltelijk betaald', color: '#C97A22' },
  overdue: { label: 'Vervallen', color: '#C4453A' },
  cancelled: { label: 'Geannuleerd', color: '#8A93A6' },
};

export default async function FacturenPage() {
  const user = await getCurrentUser();
  const supabase = createClient();
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, customer:customers(first_name, last_name)')
    .eq('business_id', user!.business_id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-950">Facturen</h1>
          <p className="text-sm text-ink-600">{invoices?.length ?? 0} facturen</p>
        </div>
        <Link href="/facturen/nieuw">
          <Button variant="primary">
            <Plus size={16} /> Nieuwe factuur
          </Button>
        </Link>
      </div>

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400">
              <th className="px-4 py-3 font-medium">Nummer</th>
              <th className="px-4 py-3 font-medium">Klant</th>
              <th className="px-4 py-3 font-medium">Datum</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Bedrag</th>
            </tr>
          </thead>
          <tbody>
            {(invoices ?? []).map((inv: any) => {
              const status = STATUS_LABELS[inv.status] ?? { label: inv.status, color: '#495164' };
              return (
                <tr key={inv.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50">
                  <td className="px-4 py-3">
                    <Link href={`/facturen/${inv.id}`} className="font-medium text-[var(--accent)] hover:underline">
                      {inv.invoice_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-700">
                    {inv.customer?.first_name} {inv.customer?.last_name}
                  </td>
                  <td className="px-4 py-3 text-ink-600">{formatDate(inv.invoice_date)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: `${status.color}1a`, color: status.color }}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink-900">{formatEuro(inv.total_incl_vat)}</td>
                </tr>
              );
            })}
            {(invoices ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink-400">
                  Nog geen facturen.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
