import Link from 'next/link';
import { getCurrentUser } from '@/lib/supabase/server';
import { Card } from '@/components/ui/primitives';
import { StatusBadge } from '@/components/StatusBadge';
import { formatEuro } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/format';
import { DateRangeFilter } from './DateRangeFilter';
import { Download } from 'lucide-react';
import { getReportData } from '@/lib/reports/data';

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

const INVOICE_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  sent: { label: 'Verzonden', color: '#0C7C82' },
  partially_paid: { label: 'Gedeeltelijk betaald', color: '#C97A22' },
  overdue: { label: 'Vervallen', color: '#C4453A' },
};

export default async function RapportagesPage({ searchParams }: { searchParams: { from?: string; to?: string } }) {
  const user = await getCurrentUser();

  const from = searchParams.from || startOfMonth();
  const to = searchParams.to || today();

  const data = await getReportData(user!.business_id, from, to);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-950">Rapportages</h1>
          <p className="text-sm text-ink-600">Omzet, BTW en winst — berekend uit werkelijke transacties.</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/reports/csv?from=${from}&to=${to}`}
            className="flex items-center gap-1.5 rounded border border-ink-200 px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            <Download size={15} /> CSV export
          </a>
          <a
            href={`/api/reports/pdf?from=${from}&to=${to}`}
            className="flex items-center gap-1.5 rounded border border-ink-200 px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            <Download size={15} /> PDF export
          </a>
        </div>
      </div>

      <DateRangeFilter from={from} to={to} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Omzet" value={formatEuro(data.totalOmzet)} />
        <StatCard label="BTW" value={formatEuro(data.totalBtw)} />
        <StatCard label="Onderdelenkosten" value={formatEuro(data.partsCost)} />
        <StatCard label="Brutowinst" value={formatEuro(data.grossProfit)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">Omzet naar bron</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-600">Reparaties</span>
              <span className="tabular-nums font-medium">{formatEuro(data.repairRevenueIncl)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-600">Producten (kassa)</span>
              <span className="tabular-nums font-medium">{formatEuro(data.productRevenueIncl)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">Populaire reparaties</h3>
          <div className="space-y-2 text-sm">
            {data.popular.map(([label, count]) => (
              <div key={label} className="flex justify-between">
                <span className="text-ink-600">{label}</span>
                <span className="tabular-nums font-medium">{count}x</span>
              </div>
            ))}
            {data.popular.length === 0 && <p className="text-ink-400">Geen data in deze periode.</p>}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">BTW per tarief</h3>
          <div className="space-y-2 text-sm">
            {data.vatBreakdown.map(([rate, vat]) => (
              <div key={rate} className="flex justify-between">
                <span className="text-ink-600">{rate}%</span>
                <span className="tabular-nums font-medium">{formatEuro(vat)}</span>
              </div>
            ))}
            {data.vatBreakdown.length === 0 && <p className="text-ink-400">Geen data in deze periode.</p>}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-400">
            Openstaande facturen ({data.outstandingInvoices.length})
          </h3>
          <span className="text-sm font-medium tabular-nums text-ink-900">
            Totaal: {formatEuro(data.totalOutstanding)}
          </span>
        </div>
        {data.outstandingInvoices.length === 0 ? (
          <p className="text-sm text-ink-400">Geen openstaande facturen.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400">
                <th className="py-2 font-medium">Nummer</th>
                <th className="py-2 font-medium">Klant</th>
                <th className="py-2 font-medium">Factuurdatum</th>
                <th className="py-2 font-medium">Vervaldatum</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 text-right font-medium">Openstaand</th>
              </tr>
            </thead>
            <tbody>
              {data.outstandingInvoices.map((inv) => {
                const status = INVOICE_STATUS_LABELS[inv.status] ?? { label: inv.status, color: '#495164' };
                return (
                  <tr key={inv.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50">
                    <td className="py-2">
                      <Link href={`/facturen/${inv.id}`} className="font-medium text-[var(--accent)] hover:underline">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-2 text-ink-700">{inv.customerName}</td>
                    <td className="py-2 text-ink-600">{formatDate(inv.invoiceDate)}</td>
                    <td className={`py-2 ${inv.overdue ? 'font-medium text-red-600' : 'text-ink-600'}`}>
                      {formatDate(inv.dueDate)}
                      {inv.overdue ? ' · vervallen' : ''}
                    </td>
                    <td className="py-2">
                      <StatusBadge name={status.label} color={status.color} />
                    </td>
                    <td className="py-2 text-right tabular-nums text-ink-900">{formatEuro(inv.outstanding)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="px-4 py-4">
      <div className="font-display text-2xl font-semibold tabular-nums text-ink-950">{value}</div>
      <div className="mt-1 text-sm text-ink-600">{label}</div>
    </Card>
  );
}
