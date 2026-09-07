import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
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

const STATUS_COLORS: Record<string, string> = {
  sent: '#0C7C82',
  partially_paid: '#C97A22',
  overdue: '#C4453A',
};

export default async function RapportagesPage({ searchParams }: { searchParams: { from?: string; to?: string } }) {
  const user = await getCurrentUser();
  const t = await getTranslations('reportsPage');
  const tStatus = await getTranslations('invoiceStatus');

  const from = searchParams.from || startOfMonth();
  const to = searchParams.to || today();

  const data = await getReportData(user!.business_id, from, to);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-950">{t('title')}</h1>
          <p className="text-sm text-ink-600">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/reports/csv?from=${from}&to=${to}`}
            className="flex items-center gap-1.5 rounded border border-ink-200 px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            <Download size={15} /> {t('csvExport')}
          </a>
          <a
            href={`/api/reports/pdf?from=${from}&to=${to}`}
            className="flex items-center gap-1.5 rounded border border-ink-200 px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            <Download size={15} /> {t('pdfExport')}
          </a>
        </div>
      </div>

      <DateRangeFilter from={from} to={to} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t('revenue')} value={formatEuro(data.totalOmzet)} />
        <StatCard label={t('vat')} value={formatEuro(data.totalBtw)} />
        <StatCard label={t('partsCost')} value={formatEuro(data.partsCost)} />
        <StatCard label={t('grossProfit')} value={formatEuro(data.grossProfit)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">{t('revenueBySource')}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-600">{t('repairs')}</span>
              <span className="tabular-nums font-medium">{formatEuro(data.repairRevenueIncl)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-600">{t('productsPos')}</span>
              <span className="tabular-nums font-medium">{formatEuro(data.productRevenueIncl)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">{t('popularRepairs')}</h3>
          <div className="space-y-2 text-sm">
            {data.popular.map(([label, count]) => (
              <div key={label} className="flex justify-between">
                <span className="text-ink-600">{label}</span>
                <span className="tabular-nums font-medium">{count}x</span>
              </div>
            ))}
            {data.popular.length === 0 && <p className="text-ink-400">{t('noDataInPeriod')}</p>}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">{t('vatByRate')}</h3>
          <div className="space-y-2 text-sm">
            {data.vatBreakdown.map(([rate, vat]) => (
              <div key={rate} className="flex justify-between">
                <span className="text-ink-600">{rate}%</span>
                <span className="tabular-nums font-medium">{formatEuro(vat)}</span>
              </div>
            ))}
            {data.vatBreakdown.length === 0 && <p className="text-ink-400">{t('noDataInPeriod')}</p>}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-400">
            {t('outstandingInvoices', { count: data.outstandingInvoices.length })}
          </h3>
          <span className="text-sm font-medium tabular-nums text-ink-900">
            {t('total', { amount: formatEuro(data.totalOutstanding) })}
          </span>
        </div>
        {data.outstandingInvoices.length === 0 ? (
          <p className="text-sm text-ink-400">{t('noOutstandingInvoices')}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400">
                <th className="py-2 font-medium">{t('colNumber')}</th>
                <th className="py-2 font-medium">{t('colCustomer')}</th>
                <th className="py-2 font-medium">{t('colInvoiceDate')}</th>
                <th className="py-2 font-medium">{t('colDueDate')}</th>
                <th className="py-2 font-medium">{t('colStatus')}</th>
                <th className="py-2 text-right font-medium">{t('colOutstanding')}</th>
              </tr>
            </thead>
            <tbody>
              {data.outstandingInvoices.map((inv) => {
                const label = STATUS_COLORS[inv.status] ? tStatus(inv.status as any) : inv.status;
                const color = STATUS_COLORS[inv.status] ?? '#495164';
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
                      {inv.overdue ? ` · ${t('overdue')}` : ''}
                    </td>
                    <td className="py-2">
                      <StatusBadge name={label} color={color} />
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
