import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { Card } from '@/components/ui/primitives';
import { StatusBadge, PaymentStatusBadge } from '@/components/StatusBadge';
import { formatDate, formatDateTime } from '@/lib/utils/format';
import { formatEuro } from '@/lib/utils/currency';
import { ArrowLeft, Phone, Mail, Smartphone } from 'lucide-react';
import { StatusChanger } from './StatusChanger';
import { AddItemForm } from './AddItemForm';
import { PaymentPanel } from './PaymentPanel';
import { RemoveItemButton } from './RemoveItemButton';
import { EmailButton } from '@/components/EmailButton';
import { emailIntakeDocument, emailCompletionReceipt } from '@/lib/actions/email';
import { PrintControls } from '@/components/PrintControls';
import { SignatureModalTrigger } from './SignatureModalTrigger';
import { RepairExtraTabs } from './RepairExtraTabs';
import { DeleteRepairButton } from './DeleteRepairButton';

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
  const t = await getTranslations('repairDetail');
  const tNav = await getTranslations('nav');

  const [
    { data: items },
    { data: statuses },
    { data: activity },
    { data: payments },
    { data: signature },
    { data: terms },
    { data: diagnosticProfile },
    { data: diagnosticRows },
    { data: photoRows },
    { data: claims },
  ] = await Promise.all([
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
    supabase.from('diagnostic_profiles').select('*').eq('business_id', user!.business_id).eq('active', true).limit(1).maybeSingle(),
    supabase.from('repair_diagnostics').select('*').eq('repair_id', repair.id),
    supabase.from('repair_photos').select('*').eq('repair_id', repair.id).order('created_at'),
    supabase.from('warranty_claims').select('*').eq('repair_id', repair.id).order('created_at', { ascending: false }),
  ]);

  const customer = repair.customer as any;
  const device = repair.device as any;
  const status = repair.status as any;
  const condition = (repair.device_condition_snapshot as Record<string, unknown>) ?? {};
  const activeTerms = (terms ?? []).find((t) => t.document_type === 'algemene_voorwaarden');

  const subtotalExclVat = (items ?? []).reduce((s, i) => s + i.total_excl_vat, 0);
  const totalVat = (items ?? []).reduce((s, i) => s + (i.total_incl_vat - i.total_excl_vat), 0);
  const totalInclVat = (items ?? []).reduce((s, i) => s + i.total_incl_vat, 0);

  const totalCost = (items ?? []).reduce((s, i) => s + (i.cost_price_excl_vat ?? 0) * i.quantity, 0);
  const profit = subtotalExclVat - totalCost;
  const margin = subtotalExclVat > 0 ? (profit / subtotalExclVat) * 100 : 0;

  const diagnosticItems = diagnosticProfile?.items ?? [];
  const diagnosticResults: Record<string, { pre: 'pass' | 'fail' | 'not_tested' | 'na'; post: 'pass' | 'fail' | 'not_tested' | 'na' }> = {};
  for (const item of diagnosticItems) diagnosticResults[item] = { pre: 'not_tested', post: 'not_tested' };
  for (const row of diagnosticRows ?? []) {
    if (!diagnosticResults[row.item]) diagnosticResults[row.item] = { pre: 'not_tested', post: 'not_tested' };
    diagnosticResults[row.item][row.stage as 'pre' | 'post'] = row.result as 'pass' | 'fail' | 'not_tested' | 'na';
  }

  const photos = await Promise.all(
    (photoRows ?? []).map(async (p) => {
      const { data: signed } = await supabase.storage.from('repair-photos').createSignedUrl(p.storage_path, 3600);
      return { id: p.id, url: signed?.signedUrl ?? '', label: p.label };
    })
  );

  const conditionFlags = Object.entries(condition).filter(([k, v]) => k !== 'other_notes' && v === true);

  const activityContent = (
    <div className="space-y-3">
      {(activity ?? []).map((a) => (
        <div key={a.id} className="text-sm">
          <div className="text-xs text-ink-400">{formatDateTime(a.created_at)}</div>
          <div className="text-ink-700">{a.description}</div>
        </div>
      ))}
      {(activity ?? []).length === 0 && <p className="text-sm text-ink-400">{t('noEvents')}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/reparaties" className="focus-ring inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800">
          <ArrowLeft size={14} /> {tNav('repairs')}
        </Link>
        <DeleteRepairButton repairId={repair.id} />
      </div>

      <div className="flex items-center gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink-950">{repair.repair_number}</h1>
        <StatusBadge name={status.name} color={status.color} />
        <PaymentStatusBadge status={repair.payment_status} />
        <span className="text-sm text-ink-400">{t('received', { date: formatDateTime(repair.date_received) })}</span>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* MAIN WORKSPACE */}
        <div className="col-span-12 space-y-5 lg:col-span-8">
          {/* Hero — device, complaint, customer. No card border: this is the dominant information (doc §14). */}
          <div>
            <div className="flex items-center gap-2 text-lg font-semibold text-ink-950">
              <Smartphone size={18} className="text-ink-400" />
              {device.brand} {device.model}
            </div>
            <div className="mt-0.5 text-xs text-ink-500">
              {device.color && <>{device.color} &middot; </>}
              {device.storage_capacity && <>{device.storage_capacity} &middot; </>}
              {device.imei ? `IMEI ${device.imei}` : t('noImei')}
            </div>

            <div className="mt-3 space-y-1 text-sm">
              {repair.customer_complaint && (
                <p className="text-ink-700">
                  <span className="font-medium text-ink-900">{t('complaint')}</span>
                  {repair.customer_complaint}
                </p>
              )}
              {repair.technician_notes && (
                <p className="text-ink-700">
                  <span className="font-medium text-ink-900">{t('technicianNotes')}</span>
                  {repair.technician_notes}
                </p>
              )}
              {!repair.customer_complaint && !repair.technician_notes && <p className="text-ink-400">{t('noNotes')}</p>}
            </div>

            <div className="mt-3 flex items-center gap-4 text-sm">
              <Link href={`/klanten/${customer.id}`} className="font-medium text-ink-900 hover:text-[var(--accent)]">
                {customer.first_name} {customer.last_name}
              </Link>
              {customer.phone && (
                <span className="flex items-center gap-1.5 text-ink-500">
                  <Phone size={13} className="text-ink-400" /> {customer.phone}
                </span>
              )}
              {customer.email && (
                <span className="flex items-center gap-1.5 text-ink-500">
                  <Mail size={13} className="text-ink-400" /> {customer.email}
                </span>
              )}
            </div>

            {(conditionFlags.length > 0 || Boolean(condition.other_notes)) && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {conditionFlags.map(([k]) => (
                  <span key={k} className="rounded-full bg-warning-50 px-2.5 py-1 text-xs font-medium text-warning-700">
                    {conditionLabels(t)[k] ?? k}
                  </span>
                ))}
                {Boolean(condition.other_notes) && (
                  <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs italic text-ink-600">{String(condition.other_notes)}</span>
                )}
              </div>
            )}
          </div>

          <Card className="p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">{t('partsAndCosts')}</h3>
            <div className="space-y-2">
              {(items ?? []).map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded border border-ink-100 px-3 py-2 text-sm">
                  <div>
                    <div className="font-medium text-ink-900">{item.description}</div>
                    <div className="text-xs text-ink-400">
                      {item.quantity}x &middot; {formatEuro(item.selling_price_excl_vat)} {t('exclVat')} &middot; {t('vat')} {item.vat_rate}%
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

          <RepairExtraTabs
            repairId={repair.id}
            diagnosticItems={diagnosticItems}
            diagnosticResults={diagnosticResults}
            photos={photos}
            claims={claims ?? []}
            activityContent={activityContent}
          />
        </div>

        {/* REPAIR SUMMARY — stays visible while switching tabs in the main workspace (doc §13). */}
        <div className="col-span-12 space-y-4 lg:col-span-4 lg:sticky lg:top-6 lg:self-start">
          <Card className="p-4">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-400">{t('price')}</h3>
            <div className="font-display text-2xl font-semibold tabular-nums text-ink-950">{formatEuro(totalInclVat)}</div>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between text-ink-600">
                <span>{t('subtotalExclVat')}</span>
                <span className="tabular-nums">{formatEuro(subtotalExclVat)}</span>
              </div>
              <div className="flex justify-between text-ink-600">
                <span>{t('vat')}</span>
                <span className="tabular-nums">{formatEuro(totalVat)}</span>
              </div>
              <div className="flex justify-between border-t border-ink-100 pt-2 text-xs text-ink-400">
                <span>{t('profitExclVat')}</span>
                <span className="tabular-nums">
                  {formatEuro(profit)} &middot; {margin.toFixed(0)}%
                </span>
              </div>
            </div>
            {repair.warranty_months && (
              <p className="mt-3 text-xs text-ink-400">{t('warrantyMonths', { months: repair.warranty_months })}</p>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">{t('status')}</h3>
            <StatusChanger repairId={repair.id} currentStatusId={status.id} statuses={statuses ?? []} />
          </Card>

          <Card className="p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">{t('payment')}</h3>
            <PaymentPanel
              repairId={repair.id}
              paymentStatus={repair.payment_status}
              totalInclVat={totalInclVat}
              payments={payments ?? []}
            />
          </Card>

          <Card className="p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">{t('documents')}</h3>
            <div className="space-y-4">
              <div>
                <p className="mb-1.5 text-xs font-medium text-ink-600">{t('intakeBon')}</p>
                <PrintControls baseUrl={`/api/repairs/${repair.id}/intake-pdf`} label={t('print')} />
                <div className="mt-1.5">
                  <EmailButton id={repair.id} action={emailIntakeDocument} defaultEmail={customer.email} label={t('emailIntake')} />
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium text-ink-600">{t('kassabon')}</p>
                <PrintControls baseUrl={`/api/repairs/${repair.id}/receipt-pdf`} label={t('print')} />
                <div className="mt-1.5">
                  <EmailButton id={repair.id} action={emailCompletionReceipt} defaultEmail={customer.email} label={t('emailReceipt')} />
                </div>
              </div>
              <div className="space-y-2 border-t border-ink-100 pt-3">
                {signature ? (
                  <div className="rounded bg-success-50 px-3 py-2 text-xs text-success-700">
                    {t('signedOn', { date: formatDateTime(signature.signed_at) })}
                  </div>
                ) : (
                  <SignatureModalTrigger repairId={repair.id} activeTerms={activeTerms ? { content: activeTerms.content, versionLabel: activeTerms.version_label } : null} />
                )}
                <Link href={`/facturen/nieuw?repair_id=${repair.id}`} className="focus-ring block rounded border border-ink-200 px-3 py-2 text-center text-sm text-ink-700 hover:bg-ink-50">
                  {t('makeInvoice')}
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function conditionLabels(t: Awaited<ReturnType<typeof getTranslations<'repairDetail'>>>): Record<string, string> {
  return {
    cond_screen: t('condScreen'),
    cond_back: t('condBack'),
    cond_frame: t('condFrame'),
    cond_camera: t('condCamera'),
    cond_buttons: t('condButtons'),
    cond_port: t('condPort'),
    cond_water: t('condWater'),
    screen_damage: t('condScreen'),
    back_glass_damage: t('condBack'),
    frame_damage: t('condFrame'),
    camera_damage: t('condCamera'),
    buttons_damage: t('condButtons'),
    charging_port_damage: t('condPort'),
    water_damage: t('condWater'),
  };
}
