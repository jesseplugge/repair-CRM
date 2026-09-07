import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { Card, Button } from '@/components/ui/primitives';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate } from '@/lib/utils/format';
import { formatEuro } from '@/lib/utils/currency';
import { Plus, FileText } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  draft: '#495164',
  sent: '#0C7C82',
  paid: '#2F8F5B',
  partially_paid: '#C97A22',
  overdue: '#C4453A',
  cancelled: '#8A93A6',
};

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-950">{t('title')}</h1>
          <p className="text-sm text-ink-600">{t('count', { count: invoices?.length ?? 0 })}</p>
        </div>
        <Link href="/facturen/nieuw">
          <Button variant="primary">
            <Plus size={16} /> {t('newInvoice')}
          </Button>
        </Link>
      </div>

      <Card>
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
            {(invoices ?? []).map((inv: any) => {
              const label = STATUS_COLORS[inv.status] ? tStatus(inv.status as any) : inv.status;
              const color = STATUS_COLORS[inv.status] ?? '#495164';
              return (
                <Tr key={inv.id}>
                  <Td>
                    <Link href={`/facturen/${inv.id}`} className="font-medium text-[var(--accent)] hover:underline">
                      {inv.invoice_number}
                    </Link>
                  </Td>
                  <Td className="text-ink-700">
                    {inv.customer?.first_name} {inv.customer?.last_name}
                  </Td>
                  <Td className="text-ink-600">{formatDate(inv.invoice_date)}</Td>
                  <Td>
                    <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: `${color}1a`, color }}>
                      {label}
                    </span>
                  </Td>
                  <Td align="right" className="tabular-nums text-ink-900">{formatEuro(inv.total_incl_vat)}</Td>
                </Tr>
              );
            })}
            {(invoices ?? []).length === 0 && (
              <tr>
                <td colSpan={5}>
                  <EmptyState icon={FileText} title={t('empty')} />
                </td>
              </tr>
            )}
          </Tbody>
        </Table>
      </Card>
    </div>
  );
}
