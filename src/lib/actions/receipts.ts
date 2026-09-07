'use server';

import { createClient, getCurrentUser } from '@/lib/supabase/server';

export type ReceiptListItem = {
  id: string;
  receiptNumber: string;
  type: string;
  format: string;
  createdAt: string;
  customerName: string | null;
  repairId: string | null;
  repairNumber: string | null;
  posSaleId: string | null;
  saleNumber: string | null;
};

export async function searchReceipts(query: string): Promise<ReceiptListItem[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = createClient();

  const { data } = await supabase
    .from('receipts')
    .select(
      'id, receipt_number, type, format, created_at, customer:customers(first_name, last_name, company_name), repair:repairs(id, repair_number), pos_sale:pos_sales(id, sale_number)'
    )
    .eq('business_id', user.business_id)
    .order('created_at', { ascending: false })
    .limit(300);

  const rows: ReceiptListItem[] = (data ?? []).map((r) => {
    const customer = r.customer as any;
    const repair = r.repair as any;
    const posSale = r.pos_sale as any;
    return {
      id: r.id,
      receiptNumber: r.receipt_number,
      type: r.type,
      format: r.format,
      createdAt: r.created_at,
      customerName: customer ? customer.company_name || `${customer.first_name} ${customer.last_name}` : null,
      repairId: repair?.id ?? null,
      repairNumber: repair?.repair_number ?? null,
      posSaleId: posSale?.id ?? null,
      saleNumber: posSale?.sale_number ?? null,
    };
  });

  const q = query.trim().toLowerCase();
  if (!q) return rows.slice(0, 50);

  return rows
    .filter(
      (r) =>
        r.receiptNumber.toLowerCase().includes(q) ||
        (r.customerName ?? '').toLowerCase().includes(q) ||
        (r.repairNumber ?? '').toLowerCase().includes(q) ||
        (r.saleNumber ?? '').toLowerCase().includes(q)
    )
    .slice(0, 50);
}
