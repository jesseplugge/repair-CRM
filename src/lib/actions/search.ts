'use server';

import { getCurrentUser, createClient } from '@/lib/supabase/server';

export type SearchResult = {
  id: string;
  type: 'customer' | 'device' | 'repair' | 'invoice' | 'product';
  title: string;
  subtitle: string;
  href: string;
};

export async function globalSearch(query: string): Promise<SearchResult[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const q = query.trim().replace(/[,()]/g, ' ').trim();
  if (q.length < 2) return [];

  const supabase = createClient();
  const businessId = user.business_id;

  const [{ data: customers }, { data: devices }, { data: repairs }, { data: invoices }, { data: products }] = await Promise.all([
    supabase
      .from('customers')
      .select('id, first_name, last_name, phone, email, customer_number')
      .eq('business_id', businessId)
      .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%,customer_number.ilike.%${q}%`)
      .limit(5),
    supabase
      .from('devices')
      .select('id, brand, model, imei, serial_number, customer_id, customer:customers(first_name, last_name)')
      .eq('business_id', businessId)
      .or(`imei.ilike.%${q}%,serial_number.ilike.%${q}%,brand.ilike.%${q}%,model.ilike.%${q}%`)
      .limit(5),
    supabase
      .from('repairs')
      .select('id, repair_number, repair_type_label, customer:customers(first_name, last_name)')
      .eq('business_id', businessId)
      .ilike('repair_number', `%${q}%`)
      .limit(5),
    supabase
      .from('invoices')
      .select('id, invoice_number, total_incl_vat, customer:customers(first_name, last_name)')
      .eq('business_id', businessId)
      .ilike('invoice_number', `%${q}%`)
      .limit(5),
    supabase.from('products').select('id, name, sku').eq('business_id', businessId).or(`name.ilike.%${q}%,sku.ilike.%${q}%`).limit(5),
  ]);

  const results: SearchResult[] = [];

  for (const c of customers ?? []) {
    results.push({
      id: c.id,
      type: 'customer',
      title: `${c.first_name} ${c.last_name}`,
      subtitle: c.phone || c.email || c.customer_number,
      href: `/klanten/${c.id}`,
    });
  }
  for (const d of devices ?? []) {
    const customer = d.customer as any;
    results.push({
      id: d.id,
      type: 'device',
      title: `${d.brand} ${d.model}`,
      subtitle: d.imei ? `IMEI ${d.imei}` : customer ? `${customer.first_name} ${customer.last_name}` : '',
      href: `/klanten/${d.customer_id}/apparaten/${d.id}`,
    });
  }
  for (const r of repairs ?? []) {
    const customer = r.customer as any;
    results.push({
      id: r.id,
      type: 'repair',
      title: r.repair_number,
      subtitle: customer ? `${customer.first_name} ${customer.last_name} · ${r.repair_type_label ?? ''}` : r.repair_type_label ?? '',
      href: `/reparaties/${r.id}`,
    });
  }
  for (const inv of invoices ?? []) {
    const customer = inv.customer as any;
    results.push({
      id: inv.id,
      type: 'invoice',
      title: inv.invoice_number,
      subtitle: customer ? `${customer.first_name} ${customer.last_name}` : '',
      href: `/facturen/${inv.id}`,
    });
  }
  for (const p of products ?? []) {
    results.push({
      id: p.id,
      type: 'product',
      title: p.name,
      subtitle: p.sku ?? '',
      href: `/producten`,
    });
  }

  return results;
}
