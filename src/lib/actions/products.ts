'use server';

import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createProduct(_prevState: { error?: string }, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const supabase = createClient();

  const name = (formData.get('name') as string)?.trim();
  const sellingPrice = parseFloat(formData.get('selling_price_excl_vat') as string);
  if (!name || isNaN(sellingPrice)) return { error: 'Naam en verkoopprijs zijn verplicht.' };

  const categoryId = (formData.get('category_id') as string) || null;
  const supplierId = (formData.get('supplier_id') as string) || null;

  const { error } = await supabase.from('products').insert({
    business_id: user.business_id,
    name,
    sku: (formData.get('sku') as string) || null,
    category_id: categoryId,
    supplier_id: supplierId,
    purchase_price_excl_vat: parseFloat((formData.get('purchase_price_excl_vat') as string) || '0'),
    selling_price_excl_vat: sellingPrice,
    vat_rate: parseFloat((formData.get('vat_rate') as string) || '21'),
    stock_quantity: parseFloat((formData.get('stock_quantity') as string) || '0'),
    minimum_stock: parseFloat((formData.get('minimum_stock') as string) || '0'),
    notes: (formData.get('notes') as string) || null,
    active: true,
  });

  if (error) return { error: error.message };
  revalidatePath('/producten');
  revalidatePath('/voorraad');
  return { error: undefined };
}

export async function createCategory(_prevState: { error?: string }, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const supabase = createClient();
  const name = (formData.get('name') as string)?.trim();
  if (!name) return { error: 'Naam is verplicht.' };
  const { error } = await supabase.from('product_categories').insert({ business_id: user.business_id, name });
  if (error) return { error: error.message };
  revalidatePath('/producten');
  return { error: undefined };
}

export async function createSupplier(_prevState: { error?: string }, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const supabase = createClient();
  const name = (formData.get('name') as string)?.trim();
  if (!name) return { error: 'Naam is verplicht.' };
  const { error } = await supabase.from('suppliers').insert({
    business_id: user.business_id,
    name,
    contact_name: (formData.get('contact_name') as string) || null,
    phone: (formData.get('phone') as string) || null,
    email: (formData.get('email') as string) || null,
  });
  if (error) return { error: error.message };
  revalidatePath('/producten');
  return { error: undefined };
}

export async function adjustStock(productId: string, delta: number) {
  const supabase = createClient();
  const { data: product } = await supabase.from('products').select('stock_quantity').eq('id', productId).single();
  if (!product) return;
  await supabase
    .from('products')
    .update({ stock_quantity: Math.max(0, product.stock_quantity + delta) })
    .eq('id', productId);
  revalidatePath('/producten');
  revalidatePath('/voorraad');
}

export async function searchProducts(query: string) {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = createClient();
  const q = query.trim().replace(/[,()]/g, ' ').trim();

  let request = supabase.from('products').select('*').eq('business_id', user.business_id).eq('active', true);
  if (q) request = request.or(`name.ilike.%${q}%,sku.ilike.%${q}%`);
  const { data } = await request.order('name').limit(20);
  return data ?? [];
}
