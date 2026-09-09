import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { Card } from '@/components/ui/primitives';
import { StatusBadge, PaymentStatusBadge } from '@/components/StatusBadge';
import { formatDateTime } from '@/lib/utils/format';
import { formatEuro } from '@/lib/utils/currency';
import {
  ArrowLeft,
  Phone,
  Mail,
  Smartphone,
  Hash,
  Fingerprint,
  Calendar,
  AlertTriangle,
  FileText,
  ShieldCheck,
  User,
  MapPin,
  StickyNote,
  ExternalLink,
  CircleDot,
  type LucideIcon,
} from 'lucide-react';
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
import { EditRepairModal } from './EditRepairModal';
import { RemoveSignatureButton } from './RemoveSignatureButton';

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

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink-950">{repair.repair_number}</h1>
        <StatusBadge name={status.name} color={status.color} />
        <PaymentStatusBadge status={repair.payment_status} />
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* MAIN WORKSPACE */}
        <div className="col-span-12 space-y-5 lg:col-span-8">
          {/* Repair Card + Customer Information — at-a-glance identity for the repair (doc §14). */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-base font-semibold text-ink-950">{t('repairCard')}</h3>
                <EditRepairModal
                  repairId={repair.id}
                  dateReceived={repair.date_received}
                  dateCompleted={repair.date_completed}
                  datePickedUp={repair.date_picked_up}
                  customerComplaint={repair.customer_complaint}
                  technicianNotes={repair.technician_notes}
                  warrantyMonths={repair.warranty_months}
                />
              </div>

              <div className="mb-4 rounded-lg bg-[var(--accent)] px-4 py-3 text-white">
                <div className="flex items-center gap-1.5 text-xs font-medium text-white/80">
                  <Hash size={12} /> {t('repairNumberLabel')}
                </div>
                <div className="mt-0.5 font-display text-lg font-semibold">{repair.repair_number}</div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${status.color ?? '#495164'}1a` }}
                  >
                    <CircleDot size={16} style={{ color: status.color ?? '#495164' }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-ink-400">{t('status')}</div>
                    <div className="text-sm font-medium" style={{ color: status.color ?? undefined }}>
                      {status.name}
                    </div>
                  </div>
                </div>

                <InfoRow icon={Smartphone} tone="teal" label={t('deviceName')}>
                  {device.brand} {device.model}
                  {device.color && <> &middot; {device.color}</>}
                  {device.storage_capacity && <> &middot; {device.storage_capacity}</>}
                </InfoRow>
                <InfoRow icon={Fingerprint} tone="amber" label={t('imeiSerial')}>
                  {device.imei || t('noImei')}
                </InfoRow>
                <InfoRow icon={Calendar} tone="green" label={t('dateReceived')}>
                  {formatDateTime(repair.date_received)}
                </InfoRow>
                {repair.warranty_months && (
                  <InfoRow icon={ShieldCheck} tone="teal" label={t('warrantyLabel')}>
                    {t('warrantyMonths', { months: repair.warranty_months })}
                  </InfoRow>
                )}
                {repair.customer_complaint && (
                  <InfoRow icon={AlertTriangle} tone="danger" label={t('complaintLabel')}>
                    {repair.customer_complaint}
                  </InfoRow>
                )}
                {repair.technician_notes && (
                  <InfoRow icon={FileText} tone="ink" label={t('technicianNotesLabel')}>
                    {repair.technician_notes}
                  </InfoRow>
                )}
              </div>

              {(conditionFlags.length > 0 || Boolean(condition.other_notes)) && (
                <div className="mt-4 flex flex-wrap gap-1.5 border-t border-ink-100 pt-3">
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
            </Card>

            <Card className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-base font-semibold text-ink-950">{t('customerInfoCard')}</h3>
                <Link
                  href={`/klanten/${customer.id}`}
                  className="focus-ring flex items-center gap-1.5 rounded px-2 py-1.5 text-sm font-medium text-ink-500 hover:bg-ink-100 hover:text-ink-800"
                >
                  <ExternalLink size={14} /> {t('viewCustomer')}
                </Link>
              </div>

              <div className="space-y-3">
                <InfoRow icon={User} tone="teal" label={t('fullName')}>
                  <Link href={`/klanten/${customer.id}`} className="hover:text-[var(--accent)]">
                    {customer.first_name} {customer.last_name}
                  </Link>
                </InfoRow>
                {customer.phone && (
                  <InfoRow icon={Phone} tone="green" label={t('phoneNumber')}>
                    {customer.phone}
                  </InfoRow>
                )}
                {customer.email && (
                  <InfoRow icon={Mail} tone="amber" label={t('emailAddress')}>
                    {customer.email}
                  </InfoRow>
                )}
                {(customer.address || customer.city) && (
                  <InfoRow icon={MapPin} tone="ink" label={t('addressLabel')}>
                    {[customer.address, customer.postcode, customer.city].filter(Boolean).join(', ')}
                  </InfoRow>
                )}
                {customer.notes && (
                  <InfoRow icon={StickyNote} tone="ink" label={t('customerNotesLabel')}>
                    {customer.notes}
                  </InfoRow>
                )}
              </div>
            </Card>
          </div>

          <Card className="p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">{t('partsAndCosts')}</h3>
            {(items ?? []).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ink-100 text-left text-xs font-semibold uppercase tracking-wide text-ink-400">
                      <th className="pb-2 pr-2 font-semibold">{t('colDescription')}</th>
                      <th className="pb-2 pr-2 text-right font-semibold">{t('colQuantity')}</th>
                      <th className="pb-2 pr-2 text-right font-semibold">{t('colPrice')}</th>
                      <th className="pb-2 pr-2 text-right font-semibold">{t('vat')}</th>
                      <th className="pb-2 pr-2 text-right font-semibold">{t('total')}</th>
                      <th className="pb-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {(items ?? []).map((item) => (
                      <tr key={item.id} className="border-b border-ink-50 last:border-0">
                        <td className="py-2 pr-2 font-medium text-ink-900">{item.description}</td>
                        <td className="py-2 pr-2 text-right tabular-nums text-ink-600">{item.quantity}x</td>
                        <td className="py-2 pr-2 text-right tabular-nums text-ink-600">{formatEuro(item.selling_price_excl_vat)}</td>
                        <td className="py-2 pr-2 text-right tabular-nums text-ink-600">{item.vat_rate}%</td>
                        <td className="py-2 pr-2 text-right tabular-nums font-medium text-ink-900">{formatEuro(item.total_incl_vat)}</td>
                        <td className="py-2 text-right">
                          <RemoveItemButton repairId={repair.id} itemId={item.id} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-ink-400">{t('noPartsYet')}</p>
            )}
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
                  <div className="flex items-center justify-between gap-2 rounded bg-success-50 px-3 py-2 text-xs text-success-700">
                    <span>{t('signedOn', { date: formatDateTime(signature.signed_at) })}</span>
                    <RemoveSignatureButton repairId={repair.id} />
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

const INFO_ROW_TONES = {
  teal: 'bg-teal-50 text-teal-600',
  amber: 'bg-amber-50 text-amber-600',
  green: 'bg-green-50 text-green-600',
  danger: 'bg-danger-50 text-danger-600',
  ink: 'bg-ink-100 text-ink-600',
} as const;

function InfoRow({
  icon: Icon,
  tone,
  label,
  children,
}: {
  icon: LucideIcon;
  tone: keyof typeof INFO_ROW_TONES;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${INFO_ROW_TONES[tone]}`}>
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-ink-400">{label}</div>
        <div className="text-sm font-medium text-ink-900">{children}</div>
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
