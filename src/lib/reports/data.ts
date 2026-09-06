import { createClient } from '@/lib/supabase/server';

export type OutstandingInvoice = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  status: string;
  totalInclVat: number;
  paid: number;
  outstanding: number;
  overdue: boolean;
};

export async function getReportData(businessId: string, from: string, to: string) {
  const supabase = createClient();
  const toExclusive = new Date(new Date(to).getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [{ data: repairs }, { data: posSales }, { data: allRepairsForPopular }, { data: outstandingRaw }] = await Promise.all([
    supabase
      .from('repairs')
      .select('id, final_price, parts_cost, payment_status, date_completed, repair_type_label')
      .eq('business_id', businessId)
      .eq('payment_status', 'paid')
      .gte('date_completed', from)
      .lt('date_completed', toExclusive),
    supabase
      .from('pos_sales')
      .select('id, subtotal_excl_vat, total_vat, total_incl_vat, status, created_at')
      .eq('business_id', businessId)
      .eq('status', 'paid')
      .gte('created_at', from)
      .lt('created_at', toExclusive),
    supabase
      .from('repairs')
      .select('repair_type_label')
      .eq('business_id', businessId)
      .gte('date_received', from)
      .lt('date_received', toExclusive),
    supabase
      .from('invoices')
      .select('id, invoice_number, invoice_date, payment_terms_days, status, total_incl_vat, customer:customers(first_name, last_name, company_name)')
      .eq('business_id', businessId)
      .in('status', ['sent', 'partially_paid', 'overdue'])
      .order('invoice_date', { ascending: true }),
  ]);

  const { data: repairItems } = await supabase
    .from('repair_items')
    .select('repair_id, total_excl_vat, total_incl_vat, vat_rate')
    .in('repair_id', (repairs ?? []).map((r) => r.id));

  const { data: posSaleItems } = await supabase
    .from('pos_sale_items')
    .select('pos_sale_id, total_excl_vat, total_incl_vat, vat_rate')
    .in('pos_sale_id', (posSales ?? []).map((p) => p.id));

  const repairRevenueIncl = (repairs ?? []).reduce((s, r) => s + (r.final_price ?? 0), 0);
  const repairRevenueExcl = (repairItems ?? []).reduce((s, i) => s + i.total_excl_vat, 0);
  const repairVat = (repairItems ?? []).reduce((s, i) => s + (i.total_incl_vat - i.total_excl_vat), 0);
  const partsCost = (repairs ?? []).reduce((s, r) => s + (r.parts_cost ?? 0), 0);

  const productRevenueIncl = (posSales ?? []).reduce((s, p) => s + p.total_incl_vat, 0);
  const productVat = (posSales ?? []).reduce((s, p) => s + p.total_vat, 0);

  const totalOmzet = repairRevenueIncl + productRevenueIncl;
  const totalBtw = repairVat + productVat;
  const grossProfit = repairRevenueExcl - partsCost + (productRevenueIncl - productVat);

  const popularity = new Map<string, number>();
  for (const r of allRepairsForPopular ?? []) {
    const label = r.repair_type_label ?? 'Overig';
    popularity.set(label, (popularity.get(label) ?? 0) + 1);
  }
  const popular = [...popularity.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const vatByRate = new Map<number, number>();
  for (const i of [...(repairItems ?? []), ...(posSaleItems ?? [])]) {
    const vat = i.total_incl_vat - i.total_excl_vat;
    vatByRate.set(i.vat_rate, (vatByRate.get(i.vat_rate) ?? 0) + vat);
  }
  const vatBreakdown = [...vatByRate.entries()].sort((a, b) => b[0] - a[0]);

  const outstandingInvoiceIds = (outstandingRaw ?? []).map((inv) => inv.id);
  const { data: outstandingPayments } = outstandingInvoiceIds.length
    ? await supabase.from('payments').select('invoice_id, amount').in('invoice_id', outstandingInvoiceIds)
    : { data: [] as { invoice_id: string | null; amount: number }[] };

  const paidByInvoice = new Map<string, number>();
  for (const p of outstandingPayments ?? []) {
    if (!p.invoice_id) continue;
    paidByInvoice.set(p.invoice_id, (paidByInvoice.get(p.invoice_id) ?? 0) + p.amount);
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const outstandingInvoices: OutstandingInvoice[] = (outstandingRaw ?? []).map((inv) => {
    const customer = inv.customer as any;
    const paid = paidByInvoice.get(inv.id) ?? 0;
    const outstanding = inv.total_incl_vat - paid;
    const dueDate = new Date(new Date(inv.invoice_date).getTime() + (inv.payment_terms_days ?? 14) * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    return {
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      customerName: customer?.company_name || `${customer?.first_name ?? ''} ${customer?.last_name ?? ''}`.trim(),
      invoiceDate: inv.invoice_date,
      dueDate,
      status: inv.status,
      totalInclVat: inv.total_incl_vat,
      paid,
      outstanding,
      overdue: dueDate < todayStr,
    };
  });
  const totalOutstanding = outstandingInvoices.reduce((s, i) => s + i.outstanding, 0);

  return {
    from,
    to,
    totalOmzet,
    totalBtw,
    partsCost,
    grossProfit,
    repairRevenueIncl,
    productRevenueIncl,
    popular,
    vatBreakdown,
    outstandingInvoices,
    totalOutstanding,
  };
}

export type ReportData = Awaited<ReturnType<typeof getReportData>>;
