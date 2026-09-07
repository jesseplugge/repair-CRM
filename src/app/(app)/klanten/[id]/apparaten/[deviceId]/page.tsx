import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { Card } from '@/components/ui/primitives';
import { StatusBadge, PaymentStatusBadge } from '@/components/StatusBadge';
import { formatDate } from '@/lib/utils/format';
import { formatEuro } from '@/lib/utils/currency';
import { ArrowLeft, Smartphone } from 'lucide-react';

export default async function DeviceHistoryPage({ params }: { params: { id: string; deviceId: string } }) {
  const user = await getCurrentUser();
  const supabase = createClient();

  const { data: device } = await supabase
    .from('devices')
    .select('*, customer:customers(id, first_name, last_name)')
    .eq('id', params.deviceId)
    .eq('business_id', user!.business_id)
    .single();
  if (!device) notFound();

  const { data: repairs } = await supabase
    .from('repairs')
    .select('id, repair_number, repair_type_label, final_price, estimated_price, payment_status, date_received, date_completed, status:repair_statuses(name, color)')
    .eq('device_id', device.id)
    .order('date_received', { ascending: false });

  const customer = device.customer as any;

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/klanten/${params.id}`} className="mb-2 flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900">
          <ArrowLeft size={14} /> {customer?.first_name} {customer?.last_name}
        </Link>
        <div className="flex items-center gap-2">
          <Smartphone size={20} className="text-ink-400" />
          <h1 className="font-display text-2xl font-semibold text-ink-950">
            {device.brand} {device.model}
          </h1>
        </div>
        <div className="mt-1 text-sm text-ink-500">
          {device.color && <>{device.color} &middot; </>}
          {device.storage_capacity && <>{device.storage_capacity} &middot; </>}
          {device.imei ? `IMEI ${device.imei}` : 'Geen IMEI'}
          {device.serial_number ? ` · S/N ${device.serial_number}` : ''}
        </div>
      </div>

      {device.existing_damage && (
        <Card className="p-4">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-400">Bekende schade</h3>
          <p className="text-sm text-ink-700">{device.existing_damage}</p>
        </Card>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">
          Reparatiegeschiedenis ({(repairs ?? []).length})
        </h2>
        <div className="space-y-3">
          {(repairs ?? []).map((r) => {
            const status = r.status as any;
            return (
              <Link key={r.id} href={`/reparaties/${r.id}`}>
                <Card className="flex items-center justify-between p-4 transition-colors hover:border-[var(--accent-border-soft)]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ink-900">{r.repair_number}</span>
                      {status && <StatusBadge name={status.name} color={status.color} />}
                    </div>
                    <div className="mt-0.5 text-sm text-ink-600">{r.repair_type_label ?? 'Reparatie'}</div>
                    <div className="mt-0.5 text-xs text-ink-400">
                      {formatDate(r.date_received)}
                      {r.date_completed ? ` — ${formatDate(r.date_completed)}` : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="tabular-nums font-medium text-ink-900">{formatEuro(r.final_price ?? r.estimated_price)}</div>
                    <PaymentStatusBadge status={r.payment_status} />
                  </div>
                </Card>
              </Link>
            );
          })}
          {(repairs ?? []).length === 0 && <p className="text-sm text-ink-400">Nog geen reparaties voor dit apparaat.</p>}
        </div>
      </div>
    </div>
  );
}
