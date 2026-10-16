import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { Card, Button } from '@/components/ui/primitives';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/StatusBadge';
import { KpiTile, KpiStrip } from '@/components/ui/kpi-tile';
import { formatDate } from '@/lib/utils/format';
import { formatEuro } from '@/lib/utils/currency';
import { Plus, FileText } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  draft: '#3C4C54',
  sent: '#1F5F73',
  paid: '#2F8F5B',
  partially_paid: '#C97A22',
  overdue: '#C4453A',
  cancelled: '#5C6D74',
};
const OUTSTANDING_STATUSES = ['sent', 'partially_paid', 'overdue'];

export default async function FacturenPage() {
  const user = await getCurrentUser();
  const supabase = createClient();
  const t = await getTranslations('invoicesList');
  const tStatus = await getTranslations('invoiceStatus');
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, customer:customers(first_name, last_name)')
    .eq('business_id', user!.business_id)
    .order('created_at', { ascending: false });

  const allInvoices = invoices ?? [];

  // Outstanding must subtract what's already been paid — a partially_paid invoice's
  // full total is not what's still owed (see InvoicePaymentPanel / lib/reports/data.ts
  // for the same paidSoFar pattern).
  const outstandingInvoiceIds = allInvoices.filter((inv) => OUTSTANDING_STATUSES.includes(inv.status)).map((inv) => inv.id);
  const { data: outstandingPayments } = outstandingInvoiceIds.length
    ? await supabase.from('payments').select('invoice_id, amount').in('invoice_id', outstandingInvoiceIds)
    : { data: [] as { invoice_id: string | null; amount: number }[] };
  const paidByInvoice = new Map<string, number>();
  for (const p of outstandingPayments ?? []) {
    if (!p.invoice_id) continue;
    paidByInvoice.set(p.invoice_id, (paidByInvoice.get(p.invoice_id) ?? 0) + p.amount);
  }
  const outstandingAmount = allInvoices
    .filter((inv) => OUTSTANDING_STATUSES.includes(inv.status))
    .reduce((sum, inv) => sum + Math.max(0, inv.total_incl_vat - (paidByInvoice.get(inv.id) ?? 0)), 0);
  const overdueCount = allInvoices.filter((inv) => inv.status === 'overdue').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-950">{t('title')}</h1>
          <p className="text-sm text-ink-600">{t('count', { count: allInvoices.length })}</p>
        </div>
        <Link href="/facturen/nieuw" className="self-start">
          <Button variant="primary">
            <Plus size={16} /> {t('newInvoice')}
          </Button>
        </Link>
      </div>

      <KpiStrip>
        <KpiTile label={t('kpiTotal')} value={allInvoices.length} />
        <KpiTile label={t('kpiOutstanding')} value={formatEuro(outstandingAmount)} emphasize={outstandingAmount > 0} />
        <KpiTile label={t('kpiOverdue')} value={overdueCount} emphasize={overdueCount > 0} />
      </KpiStrip>

      {allInvoices.length === 0 ? (
        <Card>
          <EmptyState icon={FileText} title={t('empty')} />
        </Card>
      ) : (
        <>
          <Card className="hidden md:block">
            <Table>
              <Thead>
                <tr>
                  <Th>{t('colNumber')}</Th>
                  <Th>{t('colCustomer')}</Th>
                  <Th>{t('colDate')}</Th>
                  <Th>{t('colStatus')}</Th>
                  <Th align="right">{t('colAmount')}</Th>
                </tr>
              </Thead>
              <Tbody>
                {allInvoices.map((inv: any) => {
                  const label = STATUS_COLORS[inv.status] ? tStatus(inv.status as any) : inv.status;
                  const color = STATUS_COLORS[inv.status] ?? '#3C4C54';
                  return (
                    <Tr key={inv.id}>
                      <Td>
                        <Link href={`/facturen/${inv.id}`} className="font-mono font-medium text-[var(--accent)] hover:underline">
                          {inv.invoice_number}
                        </Link>
                      </Td>
                      <Td className="text-ink-700">
                        {inv.customer?.first_name} {inv.customer?.last_name}
                      </Td>
                      <Td className="text-ink-600">{formatDate(inv.invoice_date)}</Td>
                      <Td>
                        <StatusBadge name={label} color={color} />
                      </Td>
                      <Td align="right" className="font-mono tabular-nums text-ink-900">{formatEuro(inv.total_incl_vat)}</Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </Card>

          <div className="space-y-2 md:hidden">
            {allInvoices.map((inv: any) => {
              const label = STATUS_COLORS[inv.status] ? tStatus(inv.status as any) : inv.status;
              const color = STATUS_COLORS[inv.status] ?? '#3C4C54';
              return (
                <Link
                  key={inv.id}
                  href={`/facturen/${inv.id}`}
                  className="block rounded-lg border border-ink-100 bg-white p-3 shadow-card"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate font-mono font-medium text-[var(--accent)]">{inv.invoice_number}</span>
                    <span className="shrink-0 font-mono tabular-nums font-medium text-ink-900">{formatEuro(inv.total_incl_vat)}</span>
                  </div>
                  <div className="mt-0.5 break-words text-sm text-ink-700">
                    {inv.customer?.first_name} {inv.customer?.last_name}
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-xs text-ink-400">{formatDate(inv.invoice_date)}</span>
                    <StatusBadge name={label} color={color} />
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
