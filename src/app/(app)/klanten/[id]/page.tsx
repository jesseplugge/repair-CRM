import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { Card, Button } from '@/components/ui/primitives';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricStrip } from '@/components/ui/metric-strip';
import { StatusBadge, PaymentStatusBadge } from '@/components/StatusBadge';
import { formatDate, initials } from '@/lib/utils/format';
import { formatEuro } from '@/lib/utils/currency';
import { Plus, Phone, Mail, MapPin, Wrench, ShoppingCart, Smartphone, FileText } from 'lucide-react';
import { AddDeviceForm } from './AddDeviceForm';
import { CustomerTabs } from './CustomerTabs';

const INVOICE_STATUS_COLORS: Record<string, string> = {
  draft: '#495164',
  sent: '#0C7C82',
  paid: '#2F8F5B',
  partially_paid: '#C97A22',
  overdue: '#C4453A',
  cancelled: '#8A93A6',
};

export default async function KlantProfielPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const supabase = createClient();
  const t = await getTranslations('customerDetail');
  const tInvoiceStatus = await getTranslations('invoiceStatus');

  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', params.id)
    .eq('business_id', user!.business_id)
    .single();
  if (!customer) notFound();

  const [{ data: devices }, { data: repairs }, { data: invoices }] = await Promise.all([
    supabase.from('devices').select('*').eq('customer_id', customer.id).order('created_at', { ascending: false }),
    supabase
      .from('repairs')
      .select('id, repair_number, repair_type_label, final_price, estimated_price, payment_status, date_received, status:repair_statuses(name, color)')
      .eq('customer_id', customer.id)
      .order('date_received', { ascending: false }),
    supabase
      .from('invoices')
      .select('id, invoice_number, status, invoice_date, total_incl_vat')
      .eq('customer_id', customer.id)
      .order('invoice_date', { ascending: false }),
  ]);

  const allRepairs = repairs ?? [];
  const allDevices = devices ?? [];
  const allInvoices = invoices ?? [];
  const totalSpent = allRepairs
    .filter((r) => r.payment_status === 'paid')
    .reduce((sum, r) => sum + (r.final_price ?? 0), 0);
  const outstanding = allRepairs
    .filter((r) => r.payment_status !== 'paid')
    .reduce((sum, r) => sum + (r.final_price ?? r.estimated_price ?? 0), 0);

  const overviewContent = (
    <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-400">{t('contact')}</h3>
        <div className="space-y-2 text-sm">
          {customer.phone && (
            <div className="flex items-center gap-2 text-ink-700">
              <Phone size={14} className="shrink-0 text-ink-400" />
              <span className="min-w-0 break-words">{customer.phone}</span>
            </div>
          )}
          {customer.email && (
            <div className="flex items-center gap-2 text-ink-700">
              <Mail size={14} className="shrink-0 text-ink-400" />
              <span className="min-w-0 break-words">{customer.email}</span>
            </div>
          )}
          {(customer.address || customer.city) && (
            <div className="flex items-center gap-2 text-ink-700">
              <MapPin size={14} className="shrink-0 text-ink-400" />
              <span className="min-w-0 break-words">
                {customer.address}
                {customer.address && customer.city && ', '}
                {customer.postcode} {customer.city}
              </span>
            </div>
          )}
          {!customer.phone && !customer.email && !customer.address && <p className="text-ink-400">{t('noContactInfo')}</p>}
        </div>
      </div>
      {customer.notes && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">{t('notes')}</h3>
          <p className="text-sm text-ink-700">{customer.notes}</p>
        </div>
      )}
    </div>
  );

  const repairsContent =
    allRepairs.length === 0 ? (
      <EmptyState icon={Wrench} title={t('noRepairsYet')} />
    ) : (
      <>
        <div className="hidden md:block">
          <Table>
            <Thead>
              <tr>
                <Th>{t('colNumber')}</Th>
                <Th>{t('colType')}</Th>
                <Th>{t('colDate')}</Th>
                <Th>{t('colStatus')}</Th>
                <Th>{t('colPayment')}</Th>
                <Th align="right">{t('colAmount')}</Th>
              </tr>
            </Thead>
            <Tbody>
              {allRepairs.map((r) => (
                <Tr key={r.id}>
                  <Td>
                    <Link href={`/reparaties/${r.id}`} className="font-medium text-[var(--accent)] hover:underline">
                      {r.repair_number}
                    </Link>
                  </Td>
                  <Td className="text-ink-600">{r.repair_type_label ?? '—'}</Td>
                  <Td className="text-ink-600">{formatDate(r.date_received)}</Td>
                  <Td>{r.status && <StatusBadge name={(r.status as any).name} color={(r.status as any).color} />}</Td>
                  <Td>
                    <PaymentStatusBadge status={r.payment_status} />
                  </Td>
                  <Td align="right" className="tabular-nums text-ink-900">
                    {formatEuro(r.final_price ?? r.estimated_price)}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </div>
        <div className="space-y-2 p-4 md:hidden">
          {allRepairs.map((r) => (
            <Link key={r.id} href={`/reparaties/${r.id}`} className="block rounded-lg border border-ink-100 bg-white p-3 shadow-card">
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate font-medium text-[var(--accent)]">{r.repair_number}</span>
                <span className="shrink-0 tabular-nums font-medium text-ink-900">
                  {formatEuro(r.final_price ?? r.estimated_price)}
                </span>
              </div>
              <div className="break-words text-xs text-ink-400">
                {r.repair_type_label ?? '—'} · {formatDate(r.date_received)}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {r.status && <StatusBadge name={(r.status as any).name} color={(r.status as any).color} />}
                <PaymentStatusBadge status={r.payment_status} />
              </div>
            </Link>
          ))}
        </div>
      </>
    );

  const devicesContent = (
    <div className="space-y-3 p-4">
      {allDevices.map((d) => (
        <Link key={d.id} href={`/klanten/${customer.id}/apparaten/${d.id}`}>
          <Card className="px-4 py-3 transition-colors hover:border-[var(--accent-border-soft)]">
            <div className="font-medium text-ink-900">
              {d.brand} {d.model}
            </div>
            <div className="mt-0.5 text-xs text-ink-400">
              {d.color && <>{d.color} &middot; </>}
              {d.storage_capacity && <>{d.storage_capacity} &middot; </>}
              {d.imei ? `IMEI ${d.imei}` : t('noImei')}
            </div>
          </Card>
        </Link>
      ))}
      {allDevices.length === 0 && <EmptyState icon={Smartphone} title={t('noDevicesYet')} />}
      <AddDeviceForm customerId={customer.id} />
    </div>
  );

  const invoicesContent =
    allInvoices.length === 0 ? (
      <EmptyState icon={FileText} title={t('noInvoicesYet')} />
    ) : (
      <>
        <div className="hidden md:block">
          <Table>
            <Thead>
              <tr>
                <Th>{t('colNumber')}</Th>
                <Th>{t('colDate')}</Th>
                <Th>{t('colStatus')}</Th>
                <Th align="right">{t('colAmount')}</Th>
              </tr>
            </Thead>
            <Tbody>
              {allInvoices.map((inv) => {
                const color = INVOICE_STATUS_COLORS[inv.status] ?? '#495164';
                const label = INVOICE_STATUS_COLORS[inv.status] ? tInvoiceStatus(inv.status as any) : inv.status;
                return (
                  <Tr key={inv.id}>
                    <Td>
                      <Link href={`/facturen/${inv.id}`} className="font-medium text-[var(--accent)] hover:underline">
                        {inv.invoice_number}
                      </Link>
                    </Td>
                    <Td className="text-ink-600">{formatDate(inv.invoice_date)}</Td>
                    <Td>
                      <StatusBadge name={label} color={color} />
                    </Td>
                    <Td align="right" className="tabular-nums text-ink-900">
                      {formatEuro(inv.total_incl_vat)}
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </div>
        <div className="space-y-2 p-4 md:hidden">
          {allInvoices.map((inv) => {
            const color = INVOICE_STATUS_COLORS[inv.status] ?? '#495164';
            const label = INVOICE_STATUS_COLORS[inv.status] ? tInvoiceStatus(inv.status as any) : inv.status;
            return (
              <Link key={inv.id} href={`/facturen/${inv.id}`} className="block rounded-lg border border-ink-100 bg-white p-3 shadow-card">
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate font-medium text-[var(--accent)]">{inv.invoice_number}</span>
                  <span className="shrink-0 tabular-nums font-medium text-ink-900">{formatEuro(inv.total_incl_vat)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="shrink-0 text-xs text-ink-400">{formatDate(inv.invoice_date)}</span>
                  <span className="min-w-0 shrink-0">
                    <StatusBadge name={label} color={color} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] font-display text-lg font-semibold text-[var(--accent)]">
            {initials(customer.first_name, customer.last_name)}
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-semibold text-ink-950">
              {customer.first_name} {customer.last_name}
            </h1>
            <div className="truncate text-sm text-ink-400">
              {customer.customer_number} &middot; {t('customerSince', { date: formatDate(customer.customer_since) })}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/kassa">
            <Button variant="secondary">
              <ShoppingCart size={16} /> {t('newSale')}
            </Button>
          </Link>
          <Link href={`/reparaties/nieuw?customer_id=${customer.id}`}>
            <Button variant="primary">
              <Wrench size={16} /> {t('newRepair')}
            </Button>
          </Link>
        </div>
      </div>

      <MetricStrip
        items={[
          { label: t('totalSpent'), value: formatEuro(totalSpent) },
          { label: t('outstanding'), value: formatEuro(outstanding) },
          { label: t('repairs'), value: allRepairs.length },
          { label: t('devices'), value: allDevices.length },
        ]}
      />

      <Card>
        <CustomerTabs
          overviewLabel={t('overview')}
          repairsLabel={t('repairs')}
          devicesLabel={t('devices')}
          invoicesLabel={t('invoices')}
          repairsCount={allRepairs.length}
          devicesCount={allDevices.length}
          overview={overviewContent}
          repairs={repairsContent}
          devices={devicesContent}
          invoices={invoicesContent}
        />
      </Card>
    </div>
  );
}
