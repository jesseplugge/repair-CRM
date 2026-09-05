import { notFound } from 'next/navigation';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { Card } from '@/components/ui/primitives';
import { formatDate } from '@/lib/utils/format';
import { formatEuro } from '@/lib/utils/currency';
import { InvoiceStatusSelect } from './InvoiceStatusSelect';
import { InvoicePaymentPanel } from './InvoicePaymentPanel';
import { CreditNoteManager } from './CreditNoteManager';
import { EmailButton } from '@/components/EmailButton';
import { emailInvoice } from '@/lib/actions/email';
import { PrintControls } from '@/components/PrintControls';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Concept',
  sent: 'Verzonden',
  paid: 'Betaald',
  partially_paid: 'Gedeeltelijk betaald',
  overdue: 'Vervallen',
  cancelled: 'Geannuleerd',
};

export default async function FactuurDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const supabase = createClient();

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, customer:customers(*)')
    .eq('id', params.id)
    .eq('business_id', user!.business_id)
    .single();
  if (!invoice) notFound();

  const [{ data: items }, { data: payments }, { data: creditNotes }] = await Promise.all([
    supabase.from('invoice_items').select('*').eq('invoice_id', invoice.id),
    supabase.from('payments').select('*').eq('invoice_id', invoice.id).order('paid_at', { ascending: false }),
    supabase.from('credit_notes').select('*').eq('original_invoice_id', invoice.id).order('created_at', { ascending: false }),
  ]);

  const customer = invoice.customer as any;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-950">{invoice.invoice_number}</h1>
          <p className="text-sm text-ink-600">
            {customer.first_name} {customer.last_name} &middot; {formatDate(invoice.invoice_date)}
          </p>
        </div>
        <div className="flex items-start gap-2">
          <div className="w-44">
            <PrintControls baseUrl={`/api/invoices/${invoice.id}/pdf`} label="Printen" showFormatPicker={false} />
          </div>
          <div className="w-40">
            <EmailButton id={invoice.id} action={emailInvoice} defaultEmail={customer.email} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <Card className="p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">Regels</h3>
            <div className="space-y-2">
              {(items ?? []).map((i) => (
                <div key={i.id} className="flex items-center justify-between border-b border-ink-100 pb-2 text-sm last:border-0">
                  <div>
                    <div className="text-ink-900">{i.description}</div>
                    <div className="text-xs text-ink-400">
                      {i.quantity}x &middot; {formatEuro(i.unit_price_excl_vat)} excl. &middot; BTW {i.vat_rate}%
                    </div>
                  </div>
                  <div className="tabular-nums font-medium text-ink-900">{formatEuro(i.total_incl_vat)}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1 border-t border-ink-100 pt-3 text-sm">
              <div className="flex justify-between text-ink-600">
                <span>Subtotaal excl. BTW</span>
                <span className="tabular-nums">{formatEuro(invoice.subtotal_excl_vat)}</span>
              </div>
              <div className="flex justify-between text-ink-600">
                <span>BTW</span>
                <span className="tabular-nums">{formatEuro(invoice.total_vat)}</span>
              </div>
              <div className="flex justify-between font-display text-lg font-semibold text-ink-950">
                <span>Totaal</span>
                <span className="tabular-nums">{formatEuro(invoice.total_incl_vat)}</span>
              </div>
            </div>
          </Card>
          {invoice.notes && (
            <Card className="p-4 text-sm text-ink-600">{invoice.notes}</Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Status</h3>
            <InvoiceStatusSelect invoiceId={invoice.id} currentStatus={invoice.status} />
          </Card>
          <Card className="p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Betaling</h3>
            <InvoicePaymentPanel invoiceId={invoice.id} status={invoice.status} totalInclVat={invoice.total_incl_vat} payments={payments ?? []} />
          </Card>
          <CreditNoteManager invoiceId={invoice.id} totalInclVat={invoice.total_incl_vat} creditNotes={creditNotes ?? []} />
        </div>
      </div>
    </div>
  );
}
