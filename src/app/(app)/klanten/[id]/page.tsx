import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { Card, Button } from '@/components/ui/primitives';
import { StatusBadge, PaymentStatusBadge } from '@/components/StatusBadge';
import { formatDate, formatDateTime, initials } from '@/lib/utils/format';
import { formatEuro } from '@/lib/utils/currency';
import { Plus, Phone, Mail, MapPin, Wrench } from 'lucide-react';
import { AddDeviceForm } from './AddDeviceForm';

export default async function KlantProfielPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const supabase = createClient();
  const t = await getTranslations('customerDetail');

  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', params.id)
    .eq('business_id', user!.business_id)
    .single();
  if (!customer) notFound();

  const [{ data: devices }, { data: repairs }] = await Promise.all([
    supabase.from('devices').select('*').eq('customer_id', customer.id).order('created_at', { ascending: false }),
    supabase
      .from('repairs')
      .select('id, repair_number, repair_type_label, final_price, estimated_price, payment_status, date_received, status:repair_statuses(name, color)')
      .eq('customer_id', customer.id)
      .order('date_received', { ascending: false }),
  ]);

  const allRepairs = repairs ?? [];
  const totalSpent = allRepairs
    .filter((r) => r.payment_status === 'paid')
    .reduce((sum, r) => sum + (r.final_price ?? 0), 0);
  const outstanding = allRepairs
    .filter((r) => r.payment_status !== 'paid')
    .reduce((sum, r) => sum + (r.final_price ?? r.estimated_price ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-soft)] font-display text-lg font-semibold text-[var(--accent)]">
            {initials(customer.first_name, customer.last_name)}
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink-950">
              {customer.first_name} {customer.last_name}
            </h1>
            <div className="text-sm text-ink-400">
              {customer.customer_number} &middot; {t('customerSince', { date: formatDate(customer.customer_since) })}
            </div>
          </div>
        </div>
        <Link href={`/reparaties/nieuw?customer_id=${customer.id}`}>
          <Button variant="primary">
            <Wrench size={16} /> {t('newRepair')}
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {/* Devices */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">{t('devices')}</h2>
            </div>
            <div className="space-y-3">
              {(devices ?? []).map((d) => (
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
              {(devices ?? []).length === 0 && (
                <p className="text-sm text-ink-400">{t('noDevicesYet')}</p>
              )}
              <AddDeviceForm customerId={customer.id} />
            </div>
          </section>

          {/* Repair history */}
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">{t('repairs')}</h2>
            <Card>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400">
                    <th className="px-4 py-3 font-medium">{t('colNumber')}</th>
                    <th className="px-4 py-3 font-medium">{t('colType')}</th>
                    <th className="px-4 py-3 font-medium">{t('colDate')}</th>
                    <th className="px-4 py-3 font-medium">{t('colStatus')}</th>
                    <th className="px-4 py-3 font-medium">{t('colPayment')}</th>
                    <th className="px-4 py-3 text-right font-medium">{t('colAmount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {allRepairs.map((r) => (
                    <tr key={r.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50">
                      <td className="px-4 py-3">
                        <Link href={`/reparaties/${r.id}`} className="font-medium text-[var(--accent)] hover:underline">
                          {r.repair_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-ink-600">{r.repair_type_label ?? '—'}</td>
                      <td className="px-4 py-3 text-ink-600">{formatDate(r.date_received)}</td>
                      <td className="px-4 py-3">
                        {r.status && <StatusBadge name={(r.status as any).name} color={(r.status as any).color} />}
                      </td>
                      <td className="px-4 py-3">
                        <PaymentStatusBadge status={r.payment_status} />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-ink-900">
                        {formatEuro(r.final_price ?? r.estimated_price)}
                      </td>
                    </tr>
                  ))}
                  {allRepairs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-ink-400">
                        {t('noRepairsYet')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
          </section>
        </div>

        <div className="space-y-6">
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">{t('contact')}</h3>
            <div className="space-y-2 text-sm">
              {customer.phone && (
                <div className="flex items-center gap-2 text-ink-700">
                  <Phone size={14} className="text-ink-400" /> {customer.phone}
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-2 text-ink-700">
                  <Mail size={14} className="text-ink-400" /> {customer.email}
                </div>
              )}
              {(customer.address || customer.city) && (
                <div className="flex items-center gap-2 text-ink-700">
                  <MapPin size={14} className="text-ink-400" />
                  {customer.address}
                  {customer.address && customer.city && ', '}
                  {customer.postcode} {customer.city}
                </div>
              )}
              {!customer.phone && !customer.email && !customer.address && (
                <p className="text-ink-400">{t('noContactInfo')}</p>
              )}
            </div>
            {customer.notes && (
              <>
                <h3 className="mb-1 mt-4 text-sm font-semibold uppercase tracking-wide text-ink-400">{t('notes')}</h3>
                <p className="text-sm text-ink-700">{customer.notes}</p>
              </>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">{t('totals')}</h3>
            <div className="flex items-center justify-between py-1.5 text-sm">
              <span className="text-ink-600">{t('totalSpent')}</span>
              <span className="font-display tabular-nums font-semibold text-ink-950">{formatEuro(totalSpent)}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 text-sm">
              <span className="text-ink-600">{t('outstanding')}</span>
              <span className="font-display tabular-nums font-semibold text-red-600">{formatEuro(outstanding)}</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
