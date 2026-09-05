'use server';

import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { calculateFromExclVat, calculateFromInclVat } from '@/lib/utils/currency';
import { insertPayment } from './payments';

export type InvoiceLineInput = { description: string; quantity: number; unitPriceExclVat: number; vatRate: number };

async function insertInvoiceWithLines(
  businessId: string,
  customerId: string,
  repairId: string | null,
  lines: InvoiceLineInput[],
  serviceDate: string | null,
  notes: string | null,
  userId: string
): Promise<{ error?: string; invoiceId?: string }> {
  const supabase = createClient();

  const computed = lines.map((l) => {
    const { exclVat, inclVat } = calculateFromExclVat(l.unitPriceExclVat * l.quantity, l.vatRate);
    return { ...l, totalExclVat: exclVat, vatAmount: Math.round((inclVat - exclVat) * 100) / 100, totalInclVat: inclVat };
  });
  const subtotalExclVat = computed.reduce((s, l) => s + l.totalExclVat, 0);
  const totalInclVat = computed.reduce((s, l) => s + l.totalInclVat, 0);
  const totalVat = Math.round((totalInclVat - subtotalExclVat) * 100) / 100;

  const { data: invoiceNumber, error: numError } = await supabase.rpc('next_number', {
    p_business_id: businessId,
    p_type: 'invoice',
    p_year: new Date().getFullYear(),
    p_prefix: '',
    p_pad: 5,
  });
  if (numError) return { error: numError.message };

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      business_id: businessId,
      invoice_number: invoiceNumber!,
      customer_id: customerId,
      repair_id: repairId,
      status: 'draft',
      service_date: serviceDate,
      subtotal_excl_vat: subtotalExclVat,
      total_vat: totalVat,
      total_incl_vat: totalInclVat,
      notes,
      created_by: userId,
    })
    .select('id')
    .single();
  if (error || !invoice) return { error: error?.message ?? 'Aanmaken factuur mislukt.' };

  await supabase.from('invoice_items').insert(
    computed.map((l) => ({
      invoice_id: invoice.id,
      description: l.description,
      quantity: l.quantity,
      unit_price_excl_vat: l.unitPriceExclVat,
      vat_rate: l.vatRate,
      vat_amount: l.vatAmount,
      total_excl_vat: l.totalExclVat,
      total_incl_vat: l.totalInclVat,
    }))
  );

  return { invoiceId: invoice.id };
}

export async function createInvoiceFromRepair(_prevState: { error?: string }, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const supabase = createClient();

  const repairId = formData.get('repair_id') as string;
  const { data: repair } = await supabase.from('repairs').select('*').eq('id', repairId).eq('business_id', user.business_id).single();
  if (!repair) return { error: 'Reparatie niet gevonden.' };

  const { data: items } = await supabase.from('repair_items').select('*').eq('repair_id', repairId);

  const lines: InvoiceLineInput[] = (items ?? []).map((i) => ({
    description: i.description,
    quantity: i.quantity,
    unitPriceExclVat: i.selling_price_excl_vat,
    vatRate: i.vat_rate,
  }));

  const result = await insertInvoiceWithLines(
    user.business_id,
    repair.customer_id,
    repairId,
    lines,
    repair.date_completed ?? repair.date_received,
    `Factuur voor reparatie ${repair.repair_number}`,
    user.id
  );
  if (result.error) return { error: result.error };

  revalidatePath('/facturen');
  redirect(`/facturen/${result.invoiceId}`);
}

export async function createManualInvoice(_prevState: { error?: string }, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const customerId = formData.get('customer_id') as string;
  if (!customerId) return { error: 'Selecteer een klant.' };

  const descriptions = formData.getAll('line_description') as string[];
  const quantities = formData.getAll('line_quantity') as string[];
  const prices = formData.getAll('line_price') as string[];
  const vatRates = formData.getAll('line_vat_rate') as string[];

  const lines: InvoiceLineInput[] = descriptions
    .map((desc, i) => ({
      description: desc,
      quantity: parseFloat(quantities[i] || '1'),
      unitPriceExclVat: parseFloat(prices[i] || '0'),
      vatRate: parseFloat(vatRates[i] || '21'),
    }))
    .filter((l) => l.description.trim() && !isNaN(l.unitPriceExclVat));

  if (lines.length === 0) return { error: 'Voeg minimaal één regel toe.' };

  const result = await insertInvoiceWithLines(
    user.business_id,
    customerId,
    null,
    lines,
    (formData.get('service_date') as string) || null,
    (formData.get('notes') as string) || null,
    user.id
  );
  if (result.error) return { error: result.error };

  revalidatePath('/facturen');
  redirect(`/facturen/${result.invoiceId}`);
}

export async function updateInvoiceStatus(invoiceId: string, status: string) {
  const supabase = createClient();
  await supabase.from('invoices').update({ status }).eq('id', invoiceId);
  revalidatePath(`/facturen/${invoiceId}`);
  revalidatePath('/facturen');
}

export async function recordInvoicePayment(invoiceId: string, amount: number, method: string) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const supabase = createClient();

  const { data: invoice } = await supabase.from('invoices').select('*').eq('id', invoiceId).single();
  if (!invoice) return { error: 'Factuur niet gevonden.' };

  const result = await insertPayment(
    { businessId: invoice.business_id, customerId: invoice.customer_id, invoiceId },
    amount,
    method
  );
  if (result.error) return { error: result.error };

  const { data: payments } = await supabase.from('payments').select('amount').eq('invoice_id', invoiceId);
  const paidTotal = (payments ?? []).reduce((s, p) => s + p.amount, 0);
  const newStatus = paidTotal <= 0.005 ? invoice.status : paidTotal < invoice.total_incl_vat - 0.005 ? 'partially_paid' : 'paid';
  await supabase.from('invoices').update({ status: newStatus }).eq('id', invoiceId);

  revalidatePath(`/facturen/${invoiceId}`);
  return { error: undefined };
}

/**
 * Credit note against an invoice (§18). Never deletes or edits the original
 * invoice — this is a separate, additive audit-trail row.
 */
export async function createCreditNote(
  _prevState: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const supabase = createClient();

  const invoiceId = formData.get('invoice_id') as string;
  const amountInclVat = parseFloat(formData.get('amount_incl_vat') as string);
  const vatRate = parseFloat((formData.get('vat_rate') as string) || '21');
  const reason = (formData.get('reason') as string) || null;
  if (isNaN(amountInclVat) || amountInclVat <= 0) return { error: 'Vul een geldig bedrag in.' };

  const { data: invoice } = await supabase.from('invoices').select('business_id, total_incl_vat').eq('id', invoiceId).single();
  if (!invoice) return { error: 'Factuur niet gevonden.' };

  const { exclVat, vatAmount } = calculateFromInclVat(amountInclVat, vatRate);

  const { data: creditNoteNumber, error: numError } = await supabase.rpc('next_number', {
    p_business_id: invoice.business_id,
    p_type: 'credit_note',
    p_year: new Date().getFullYear(),
    p_prefix: 'CN-',
    p_pad: 4,
  });
  if (numError) return { error: numError.message };

  const { error } = await supabase.from('credit_notes').insert({
    business_id: invoice.business_id,
    credit_note_number: creditNoteNumber!,
    original_invoice_id: invoiceId,
    amount_excl_vat: exclVat,
    vat_amount: vatAmount,
    amount_incl_vat: amountInclVat,
    reason,
    created_by: user.id,
  });
  if (error) return { error: error.message };

  // A credit note covering the full invoice amount cancels it; a partial one just gets logged.
  if (Math.abs(amountInclVat - invoice.total_incl_vat) < 0.01) {
    await supabase.from('invoices').update({ status: 'cancelled' }).eq('id', invoiceId);
  }

  revalidatePath(`/facturen/${invoiceId}`);
  return { error: undefined };
}
