'use server';

import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { calculateFromExclVat } from '@/lib/utils/currency';
import { insertPayment } from './payments';

export type CartLine = {
  productId: string | null;
  description: string;
  quantity: number;
  unitPriceExclVat: number;
  vatRate: number;
};

export async function checkoutPosSale(
  lines: CartLine[],
  customerId: string | null,
  method: string | null
): Promise<{ error?: string; saleId?: string }> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (lines.length === 0) return { error: 'Winkelmandje is leeg.' };
  const supabase = createClient();

  const computed = lines.map((l) => {
    const { exclVat, inclVat } = calculateFromExclVat(l.unitPriceExclVat * l.quantity, l.vatRate);
    return { ...l, totalExclVat: exclVat, totalInclVat: inclVat };
  });
  const subtotalExclVat = computed.reduce((s, l) => s + l.totalExclVat, 0);
  const totalInclVat = computed.reduce((s, l) => s + l.totalInclVat, 0);
  const totalVat = Math.round((totalInclVat - subtotalExclVat) * 100) / 100;

  const { data: saleNumber, error: numError } = await supabase.rpc('next_number', {
    p_business_id: user.business_id,
    p_type: 'pos_sale',
    p_year: new Date().getFullYear(),
    p_prefix: 'V-',
    p_pad: 5,
  });
  if (numError) return { error: numError.message };

  const { data: sale, error: saleError } = await supabase
    .from('pos_sales')
    .insert({
      business_id: user.business_id,
      sale_number: saleNumber!,
      customer_id: customerId,
      status: method ? 'paid' : 'unpaid',
      subtotal_excl_vat: subtotalExclVat,
      total_vat: totalVat,
      total_incl_vat: totalInclVat,
      created_by: user.id,
    })
    .select('id')
    .single();
  if (saleError || !sale) return { error: saleError?.message ?? 'Verkoop aanmaken mislukt.' };

  const { error: itemsError } = await supabase.from('pos_sale_items').insert(
    computed.map((l) => ({
      pos_sale_id: sale.id,
      product_id: l.productId,
      description: l.description,
      quantity: l.quantity,
      unit_price_excl_vat: l.unitPriceExclVat,
      vat_rate: l.vatRate,
      discount: 0,
      total_excl_vat: l.totalExclVat,
      total_incl_vat: l.totalInclVat,
    }))
  );
  if (itemsError) return { error: itemsError.message };

  // Decrement stock for any lines linked to a product.
  for (const line of computed) {
    if (!line.productId) continue;
    const { data: product } = await supabase.from('products').select('stock_quantity').eq('id', line.productId).single();
    if (product) {
      await supabase
        .from('products')
        .update({ stock_quantity: Math.max(0, product.stock_quantity - line.quantity) })
        .eq('id', line.productId);
    }
  }

  if (method) {
    const result = await insertPayment(
      { businessId: user.business_id, customerId, posSaleId: sale.id },
      totalInclVat,
      method
    );
    if (result.error) return { error: result.error };
  }

  revalidatePath('/kassa');
  revalidatePath('/voorraad');
  revalidatePath('/producten');
  return { saleId: sale.id };
}
