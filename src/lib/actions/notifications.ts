'use server';

import { getCurrentUser, createClient } from '@/lib/supabase/server';

export type Notification = {
  key: string;
  icon: string;
  text: string;
  href: string;
};

export async function getNotifications(): Promise<Notification[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = createClient();
  const businessId = user.business_id;
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: readyRepairs }, { data: products }, { data: outstandingInvoices }, { data: openClaims }] = await Promise.all([
    supabase
      .from('repairs')
      .select('id, repair_number, date_completed, customer:customers(first_name, last_name)')
      .eq('business_id', businessId)
      .lt('date_completed', fiveDaysAgo)
      .is('date_picked_up', null),
    supabase.from('products').select('id, name, stock_quantity, minimum_stock').eq('business_id', businessId).eq('active', true),
    supabase
      .from('invoices')
      .select('id, invoice_number, invoice_date, payment_terms_days, total_incl_vat')
      .eq('business_id', businessId)
      .in('status', ['sent', 'overdue']),
    supabase
      .from('warranty_claims')
      .select('id, claim_number, repair:repairs(repair_number)')
      .eq('business_id', businessId)
      .in('status', ['new', 'investigating', 'approved', 'repairing']),
  ]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const overdueInvoices = (outstandingInvoices ?? []).filter((inv) => {
    const due = new Date(new Date(inv.invoice_date).getTime() + (inv.payment_terms_days ?? 14) * 24 * 60 * 60 * 1000);
    return due.toISOString().slice(0, 10) < todayStr;
  });
  const lowStock = (products ?? []).filter((p) => p.stock_quantity <= (p.minimum_stock ?? 0));

  const notifications: Notification[] = [
    ...(openClaims ?? []).map((c) => ({
      key: `claim-${c.id}`,
      icon: '🔴',
      text: `Garantieclaim ${c.claim_number} (${(c.repair as any)?.repair_number ?? ''}) staat open`,
      href: '/garantie',
    })),
    ...(readyRepairs ?? []).map((r) => {
      const customer = r.customer as any;
      const days = Math.floor((Date.now() - new Date(r.date_completed!).getTime()) / (24 * 60 * 60 * 1000));
      return {
        key: `ready-${r.id}`,
        icon: '🟠',
        text: `${r.repair_number} (${customer?.first_name} ${customer?.last_name}) wacht al ${days} dagen op ophalen`,
        href: `/reparaties/${r.id}`,
      };
    }),
    ...lowStock.map((p) => ({
      key: `stock-${p.id}`,
      icon: '📦',
      text: `${p.name} bijna op (${p.stock_quantity} over)`,
      href: '/voorraad',
    })),
    ...overdueInvoices.map((inv) => ({
      key: `inv-${inv.id}`,
      icon: '💶',
      text: `Factuur ${inv.invoice_number} is vervallen`,
      href: `/facturen/${inv.id}`,
    })),
  ];

  return notifications;
}
