import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { Card } from '@/components/ui/primitives';
import { StatusBadge, PaymentStatusBadge } from '@/components/StatusBadge';
import { formatDate, formatDateTime } from '@/lib/utils/format';
import { formatEuro } from '@/lib/utils/currency';
import { Phone, Mail, Smartphone } from 'lucide-react';
import { StatusChanger } from './StatusChanger';
import { AddItemForm } from './AddItemForm';
import { PaymentPanel } from './PaymentPanel';
import { RemoveItemButton } from './RemoveItemButton';
import { EmailButton } from '@/components/EmailButton';
import { emailIntakeDocument, emailCompletionReceipt } from '@/lib/actions/email';
import { PrintControls } from '@/components/PrintControls';
import { SignatureModalTrigger } from './SignatureModalTrigger';

export default async function ReparatieDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const supabase = createClient();

  const { data: repair } = await supabase
    .from('repairs')
    .select(
      '*, customer:customers(*), device:devices(*), status:repair_statuses(id, name, color, is_terminal)'
    )
    .eq('id', params.id)
    .eq('business_id', user!.business_id)
    .single();
  if (!repair) notFound();

  const [{ data: items }, { data: statuses }, { data: activity }, { data: payments }, { data: signature }, { data: terms }] = await Promise.all([
    supabase.from('repair_items').select('*').eq('repair_id', repair.id).order('created_at'),
    supabase.from('repair_statuses').select('*').eq('business_id', user!.business_id).order('sort_order'),
    supabase
      .from('activity_logs')
      .select('*')
      .eq('entity_type', 'repair')
      .eq('entity_id', repair.id)
      .order('created_at', { ascending: false }),
    supabase.from('payments').select('*').eq('repair_id', repair.id).order('paid_at', { ascending: false }),
    supabase.from('intake_signatures').select('*').eq('repair_id', repair.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('terms_versions').select('*').eq('business_id', user!.business_id).eq('is_active', true),
  ]);

  const customer = repair.customer as any;
  const device = repair.device as any;
  const status = repair.status as any;
  const condition = (repair.device_condition_snapshot as Record<string, unknown>) ?? {};
  const activeTerms = (terms ?? []).find((t) => t.document_type === 'algemene_voorwaarden');

  const subtotalExclVat = (items ?? []).reduce((s, i) => s + i.total_excl_vat, 0);
  const totalVat = (items ?? []).reduce((s, i) => s + (i.total_incl_vat - i.total_excl_vat), 0);
  const totalInclVat = (items ?? []).reduce((s, i) => s + i.total_incl_vat, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-semibold text-ink-950">{repair.repair_number}</h1>
            <StatusBadge name={status.name} color={status.color} />
            <PaymentStatusBadge status={repair.payment_status} />
          </div>
          <p className="text-sm text-ink-600">Ontvangen {formatDateTime(repair.date_received)}</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* LEFT — customer + device */}
        <div className="col-span-3 space-y-4">
          <Card className="p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Klant</h3>
            <Link href={`/klanten/${customer.id}`} className="font-medium text-ink-900 hover:text-[var(--accent)]">
              {customer.first_name} {customer.last_name}
            </Link>
            <div className="mt-2 space-y-1 text-sm text-ink-600">
              {customer.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone size={13} className="text-ink-400" /> {customer.phone}
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-1.5">
                  <Mail size={13} className="text-ink-400" /> {customer.email}
                </div>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Apparaat</h3>
            <div className="flex items-center gap-1.5 font-medium text-ink-900">
              <Smartphone size={14} className="text-ink-400" />
              {device.brand} {device.model}
            </div>
            <div className="mt-1 text-xs text-ink-500">
              {device.color && <>{device.color} &middot; </>}
              {device.storage_capacity && <>{device.storage_capacity} &middot; </>}
              {device.imei ? `IMEI ${device.imei}` : 'Geen IMEI'}
            </div>
            {device.existing_damage && <p className="mt-2 text-sm text-ink-600">{device.existing_damage}</p>}
          </Card>

          <Card className="p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Staat bij intake</h3>
            <ul className="space-y-1 text-sm text-ink-600">
              {Object.entries(condition)
                .filter(([k, v]) => k !== 'other_notes' && v === true)
                .map(([k]) => (
                  <li key={k}>&bull; {CONDITION_LABELS[k] ?? k}</li>
                ))}
              {Boolean(condition.other_notes) && <li className="italic text-ink-500">{String(condition.other_notes)}</li>}
              {Object.entries(condition).filter(([k, v]) => k !== 'other_notes' && v === true).length === 0 &&
                !condition.other_notes && <li className="text-ink-400">Geen schade geregistreerd</li>}
            </ul>
          </Card>
        </div>

        {/* MIDDLE — details + items + timeline */}
        <div className="col-span-6 space-y-4">
          <Card className="p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Klacht &amp; notities</h3>
            {repair.customer_complaint && (
              <p className="mb-2 text-sm text-ink-700">
                <span className="font-medium">Klacht: </span>
                {repair.customer_complaint}
              </p>
            )}
            {repair.technician_notes && (
              <p className="text-sm text-ink-700">
                <span className="font-medium">Notities: </span>
                {repair.technician_notes}
              </p>
            )}
            {!repair.customer_complaint && !repair.technician_notes && (
              <p className="text-sm text-ink-400">Geen notities.</p>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">Onderdelen &amp; kosten</h3>
            <div className="space-y-2">
              {(items ?? []).map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded border border-ink-100 px-3 py-2 text-sm">
                  <div>
                    <div className="font-medium text-ink-900">{item.description}</div>
                    <div className="text-xs text-ink-400">
                      {item.quantity}x &middot; {formatEuro(item.selling_price_excl_vat)} excl. BTW &middot; BTW {item.vat_rate}%
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="tabular-nums font-medium text-ink-900">{formatEuro(item.total_incl_vat)}</div>
                    <RemoveItemButton repairId={repair.id} itemId={item.id} />
                  </div>
                </div>
              ))}
            </div>
            <AddItemForm repairId={repair.id} />
          </Card>

          <Card className="p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">Tijdlijn</h3>
            <div className="space-y-3">
              {(activity ?? []).map((a) => (
                <div key={a.id} className="text-sm">
                  <div className="text-xs text-ink-400">{formatDateTime(a.created_at)}</div>
                  <div className="text-ink-700">{a.description}</div>
                </div>
              ))}
              {(activity ?? []).length === 0 && <p className="text-sm text-ink-400">Nog geen gebeurtenissen.</p>}
            </div>
          </Card>
        </div>

        {/* RIGHT — price + status + payment */}
        <div className="col-span-3 space-y-4">
          <Card className="p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">Prijs</h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-ink-600">
                <span>Subtotaal excl. BTW</span>
                <span className="tabular-nums">{formatEuro(subtotalExclVat)}</span>
              </div>
              <div className="flex justify-between text-ink-600">
                <span>BTW</span>
                <span className="tabular-nums">{formatEuro(totalVat)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-ink-100 pt-2 font-display text-lg font-semibold text-ink-950">
                <span>Totaal</span>
                <span className="tabular-nums">{formatEuro(totalInclVat)}</span>
              </div>
            </div>
            {repair.warranty_months && (
              <p className="mt-3 text-xs text-ink-400">Garantie: {repair.warranty_months} maanden na oplevering</p>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">Status</h3>
            <StatusChanger repairId={repair.id} currentStatusId={status.id} statuses={statuses ?? []} />
          </Card>

          <Card className="p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">Betaling</h3>
            <PaymentPanel
              repairId={repair.id}
              paymentStatus={repair.payment_status}
              totalInclVat={totalInclVat}
              payments={payments ?? []}
            />
          </Card>

          <Card className="p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">Documenten</h3>
            <div className="space-y-4">
              <div>
                <p className="mb-1.5 text-xs font-medium text-ink-600">Intakebon</p>
                <PrintControls baseUrl={`/api/repairs/${repair.id}/intake-pdf`} label="Printen" />
                <div className="mt-1.5">
                  <EmailButton id={repair.id} action={emailIntakeDocument} defaultEmail={customer.email} label="Intakebon e-mailen" />
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium text-ink-600">Kassabon</p>
                <PrintControls baseUrl={`/api/repairs/${repair.id}/receipt-pdf`} label="Printen" />
                <div className="mt-1.5">
                  <EmailButton id={repair.id} action={emailCompletionReceipt} defaultEmail={customer.email} label="Kassabon e-mailen" />
                </div>
              </div>
              <div className="space-y-2 border-t border-ink-100 pt-3">
                {signature ? (
                  <div className="rounded bg-green-50 px-3 py-2 text-xs text-green-700">
                    ✓ Ondertekend op {formatDateTime(signature.signed_at)}
                  </div>
                ) : (
                  <SignatureModalTrigger repairId={repair.id} activeTerms={activeTerms ? { content: activeTerms.content, versionLabel: activeTerms.version_label } : null} />
                )}
                <Link href={`/facturen/nieuw?repair_id=${repair.id}`} className="block rounded border border-ink-200 px-3 py-2 text-center text-sm text-ink-700 hover:bg-ink-50">
                  Factuur maken
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

const CONDITION_LABELS: Record<string, string> = {
  cond_screen: 'Schermschade',
  cond_back: 'Achterglas beschadigd',
  cond_frame: 'Frame beschadigd',
  cond_camera: 'Camera beschadigd',
  cond_buttons: 'Knoppen',
  cond_port: 'Laadconnector',
  cond_water: 'Waterschade',
  screen_damage: 'Schermschade',
  back_glass_damage: 'Achterglas beschadigd',
  frame_damage: 'Frame beschadigd',
  camera_damage: 'Camera beschadigd',
  buttons_damage: 'Knoppen',
  charging_port_damage: 'Laadconnector',
  water_damage: 'Waterschade',
};
