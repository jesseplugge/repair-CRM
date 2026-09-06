import { renderToBuffer } from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase/server';
import { ReceiptDocument } from './ReceiptDocument';
import { InvoiceDocument } from './InvoiceDocument';
import { SignedIntakeDocument } from './SignedIntakeDocument';
import { ReportDocument } from './ReportDocument';
import { businessForPdf } from './data';
import { getReportData } from '@/lib/reports/data';
import type { DocFormat } from './format';

export type GeneratedPdf = {
  buffer: Buffer;
  filename: string;
  documentNumber: string;
  customerEmail: string | null;
  customerName: string;
};

async function findOrCreateReceipt(
  businessId: string,
  userId: string,
  type: string,
  format: DocFormat,
  fields: { customer_id: string | null; repair_id?: string | null; pos_sale_id?: string | null }
) {
  const supabase = createClient();
  let query = supabase.from('receipts').select('receipt_number').eq('business_id', businessId).eq('type', type);
  if (fields.repair_id) query = query.eq('repair_id', fields.repair_id);
  if (fields.pos_sale_id) query = query.eq('pos_sale_id', fields.pos_sale_id);
  let { data: receipt } = await query.maybeSingle();

  if (!receipt) {
    const { data: receiptNumber } = await supabase.rpc('next_number', {
      p_business_id: businessId,
      p_type: 'receipt',
      p_year: new Date().getFullYear(),
      p_prefix: 'BON-',
      p_pad: 5,
    });
    const { data: created } = await supabase
      .from('receipts')
      .insert({ business_id: businessId, receipt_number: receiptNumber!, type, format, created_by: userId, ...fields })
      .select('receipt_number')
      .single();
    receipt = created;
  }
  return receipt!.receipt_number;
}

export async function generateIntakePdf(repairId: string, businessId: string, userId: string, format: DocFormat): Promise<GeneratedPdf | null> {
  const supabase = createClient();
  const { data: repair } = await supabase
    .from('repairs')
    .select('*, customer:customers(*), device:devices(*)')
    .eq('id', repairId)
    .eq('business_id', businessId)
    .single();
  if (!repair) return null;

  const [{ data: business }, { data: items }] = await Promise.all([
    supabase.from('businesses').select('*').eq('id', businessId).single(),
    supabase.from('repair_items').select('*').eq('repair_id', repair.id),
  ]);
  const customer = repair.customer as any;
  const device = repair.device as any;
  const subtotalExclVat = (items ?? []).reduce((s, i) => s + i.total_excl_vat, 0);
  const totalVat = (items ?? []).reduce((s, i) => s + (i.total_incl_vat - i.total_excl_vat), 0);
  const totalInclVat = (items ?? []).reduce((s, i) => s + i.total_incl_vat, 0);

  const documentNumber = await findOrCreateReceipt(businessId, userId, 'intake', format, {
    customer_id: repair.customer_id,
    repair_id: repair.id,
  });

  const buffer = await renderToBuffer(
    <ReceiptDocument
      format={format}
      kind="intake"
      documentNumber={documentNumber}
      repairNumber={repair.repair_number}
      dateTime={repair.date_received}
      business={businessForPdf(business)}
      customer={{ name: `${customer.first_name} ${customer.last_name}`, phone: customer.phone, email: customer.email }}
      device={{
        brand: device.brand,
        model: device.model,
        imei: device.imei,
        color: device.color,
        storage: device.storage_capacity,
        conditionNotes: device.existing_damage,
      }}
      lines={(items ?? []).map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unitPriceExclVat: i.selling_price_excl_vat,
        vatRate: i.vat_rate,
        totalInclVat: i.total_incl_vat,
      }))}
      subtotalExclVat={subtotalExclVat}
      totalVat={totalVat}
      totalInclVat={totalInclVat}
      complaint={repair.customer_complaint}
      termsNote="Dit is een geschatte prijs. De definitieve prijs kan afwijken na diagnose."
    />
  );

  return {
    buffer,
    filename: `${documentNumber}-intake.pdf`,
    documentNumber,
    customerEmail: customer.email,
    customerName: `${customer.first_name} ${customer.last_name}`,
  };
}

export async function generateCompletionPdf(repairId: string, businessId: string, userId: string, format: DocFormat): Promise<GeneratedPdf | null> {
  const supabase = createClient();
  const { data: repair } = await supabase
    .from('repairs')
    .select('*, customer:customers(*), device:devices(*)')
    .eq('id', repairId)
    .eq('business_id', businessId)
    .single();
  if (!repair) return null;

  const [{ data: business }, { data: items }, { data: payments }] = await Promise.all([
    supabase.from('businesses').select('*').eq('id', businessId).single(),
    supabase.from('repair_items').select('*').eq('repair_id', repair.id),
    supabase.from('payments').select('*').eq('repair_id', repair.id).order('paid_at', { ascending: false }),
  ]);
  const customer = repair.customer as any;
  const device = repair.device as any;
  const subtotalExclVat = (items ?? []).reduce((s, i) => s + i.total_excl_vat, 0);
  const totalVat = (items ?? []).reduce((s, i) => s + (i.total_incl_vat - i.total_excl_vat), 0);
  const totalInclVat = (items ?? []).reduce((s, i) => s + i.total_incl_vat, 0);
  const lastPaymentMethod = payments && payments[0] ? payments[0].method : repair.payment_method;

  const documentNumber = await findOrCreateReceipt(businessId, userId, 'repair_completion', format, {
    customer_id: repair.customer_id,
    repair_id: repair.id,
  });

  const buffer = await renderToBuffer(
    <ReceiptDocument
      format={format}
      kind="completion"
      documentNumber={documentNumber}
      repairNumber={repair.repair_number}
      dateTime={repair.date_completed ?? new Date().toISOString()}
      business={businessForPdf(business)}
      customer={{ name: `${customer.first_name} ${customer.last_name}`, phone: customer.phone, email: customer.email }}
      device={{ brand: device.brand, model: device.model, imei: device.imei }}
      lines={(items ?? []).map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unitPriceExclVat: i.selling_price_excl_vat,
        vatRate: i.vat_rate,
        totalInclVat: i.total_incl_vat,
      }))}
      subtotalExclVat={subtotalExclVat}
      totalVat={totalVat}
      totalInclVat={totalInclVat}
      paymentMethod={lastPaymentMethod}
      warrantyMonths={repair.warranty_months}
    />
  );

  return {
    buffer,
    filename: `${documentNumber}.pdf`,
    documentNumber,
    customerEmail: customer.email,
    customerName: `${customer.first_name} ${customer.last_name}`,
  };
}

export async function generateInvoicePdf(invoiceId: string, businessId: string): Promise<GeneratedPdf | null> {
  const supabase = createClient();
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, customer:customers(*)')
    .eq('id', invoiceId)
    .eq('business_id', businessId)
    .single();
  if (!invoice) return null;

  const [{ data: business }, { data: items }] = await Promise.all([
    supabase.from('businesses').select('*').eq('id', businessId).single(),
    supabase.from('invoice_items').select('*').eq('invoice_id', invoice.id),
  ]);
  const customer = invoice.customer as any;

  const buffer = await renderToBuffer(
    <InvoiceDocument
      invoiceNumber={invoice.invoice_number}
      invoiceDate={invoice.invoice_date}
      serviceDate={invoice.service_date}
      paymentTermsDays={invoice.payment_terms_days}
      status={invoice.status}
      business={businessForPdf(business)}
      customer={{
        name: `${customer.first_name} ${customer.last_name}`,
        companyName: customer.company_name,
        address: customer.address,
        postcode: customer.postcode,
        city: customer.city,
      }}
      lines={(items ?? []).map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unitPriceExclVat: i.unit_price_excl_vat,
        vatRate: i.vat_rate,
        vatAmount: i.vat_amount,
        totalExclVat: i.total_excl_vat,
        totalInclVat: i.total_incl_vat,
      }))}
      subtotalExclVat={invoice.subtotal_excl_vat}
      totalVat={invoice.total_vat}
      totalInclVat={invoice.total_incl_vat}
      notes={invoice.notes}
    />
  );

  return {
    buffer,
    filename: `${invoice.invoice_number}.pdf`,
    documentNumber: invoice.invoice_number,
    customerEmail: customer.email,
    customerName: `${customer.first_name} ${customer.last_name}`,
  };
}

export async function generateSignedIntakePdf(repairId: string, businessId: string): Promise<GeneratedPdf | null> {
  const supabase = createClient();
  const { data: repair } = await supabase
    .from('repairs')
    .select('*, customer:customers(*), device:devices(*)')
    .eq('id', repairId)
    .eq('business_id', businessId)
    .single();
  if (!repair) return null;

  const [{ data: business }, { data: signature }] = await Promise.all([
    supabase.from('businesses').select('*').eq('id', businessId).single(),
    supabase
      .from('intake_signatures')
      .select('*')
      .eq('repair_id', repair.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (!signature) return null;

  const customer = repair.customer as any;
  const device = repair.device as any;
  const terms = signature.terms_accepted as { document_type: string; version_label: string; terms_version_id: string }[];
  const { data: termsVersions } = await supabase
    .from('terms_versions')
    .select('id, document_type, version_label, effective_date')
    .in('id', terms.map((t) => t.terms_version_id));

  const buffer = await renderToBuffer(
    <SignedIntakeDocument
      repairNumber={repair.repair_number}
      business={businessForPdf(business)}
      customer={{ name: `${customer.first_name} ${customer.last_name}`, phone: customer.phone }}
      device={{ brand: device.brand, model: device.model, imei: device.imei, conditionNotes: device.existing_damage }}
      repairTypeLabel={repair.repair_type_label ?? '—'}
      estimatedPrice={signature.estimated_price_at_signing}
      termsVersions={(termsVersions ?? []).map((t) => ({
        documentType: t.document_type,
        versionLabel: t.version_label,
        effectiveDate: t.effective_date,
      }))}
      signatureImage={signature.signature_image}
      signedAt={signature.signed_at}
    />
  );

  return {
    buffer,
    filename: `${repair.repair_number}-ondertekend.pdf`,
    documentNumber: repair.repair_number,
    customerEmail: customer.email,
    customerName: `${customer.first_name} ${customer.last_name}`,
  };
}

export async function generatePosReceiptPdf(saleId: string, businessId: string, userId: string, format: DocFormat): Promise<GeneratedPdf | null> {
  const supabase = createClient();
  const { data: sale } = await supabase
    .from('pos_sales')
    .select('*, customer:customers(*)')
    .eq('id', saleId)
    .eq('business_id', businessId)
    .single();
  if (!sale) return null;

  const [{ data: business }, { data: items }, { data: payments }] = await Promise.all([
    supabase.from('businesses').select('*').eq('id', businessId).single(),
    supabase.from('pos_sale_items').select('*').eq('pos_sale_id', sale.id),
    supabase.from('payments').select('*').eq('pos_sale_id', sale.id).order('paid_at', { ascending: false }),
  ]);
  const customer = sale.customer as any;

  const documentNumber = await findOrCreateReceipt(businessId, userId, 'pos_sale', format, {
    customer_id: sale.customer_id,
    pos_sale_id: sale.id,
  });

  const buffer = await renderToBuffer(
    <ReceiptDocument
      format={format}
      kind="completion"
      documentNumber={documentNumber}
      dateTime={sale.created_at}
      business={businessForPdf(business)}
      customer={{
        name: customer ? `${customer.first_name} ${customer.last_name}` : 'Contant',
        phone: customer?.phone,
        email: customer?.email,
      }}
      lines={(items ?? []).map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unitPriceExclVat: i.unit_price_excl_vat,
        vatRate: i.vat_rate,
        totalInclVat: i.total_incl_vat,
      }))}
      subtotalExclVat={sale.subtotal_excl_vat}
      totalVat={sale.total_vat}
      totalInclVat={sale.total_incl_vat}
      paymentMethod={payments && payments[0] ? payments[0].method : null}
    />
  );

  return {
    buffer,
    filename: `${documentNumber}.pdf`,
    documentNumber,
    customerEmail: customer?.email ?? null,
    customerName: customer ? `${customer.first_name} ${customer.last_name}` : 'Contant',
  };
}

export async function generateReportPdf(businessId: string, from: string, to: string) {
  const supabase = createClient();
  const [{ data: business }, data] = await Promise.all([
    supabase.from('businesses').select('*').eq('id', businessId).single(),
    getReportData(businessId, from, to),
  ]);

  const buffer = await renderToBuffer(
    <ReportDocument businessName={businessForPdf(business).name} data={data} />
  );

  return { buffer, filename: `rapportage-${from}-tot-${to}.pdf` };
}
