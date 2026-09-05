'use server';

import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function updateBusiness(
  _prevState: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const supabase = createClient();

  const { error } = await supabase
    .from('businesses')
    .update({
      legal_name: formData.get('legal_name') as string,
      trading_name: (formData.get('trading_name') as string) || null,
      address: (formData.get('address') as string) || null,
      postcode: (formData.get('postcode') as string) || null,
      city: (formData.get('city') as string) || null,
      phone: (formData.get('phone') as string) || null,
      email: (formData.get('email') as string) || null,
      website: (formData.get('website') as string) || null,
      kvk_number: (formData.get('kvk_number') as string) || null,
      vat_number: (formData.get('vat_number') as string) || null,
      iban: (formData.get('iban') as string) || null,
      default_vat_rate: parseFloat((formData.get('default_vat_rate') as string) || '21'),
      default_warranty_months: parseInt((formData.get('default_warranty_months') as string) || '3', 10),
    })
    .eq('id', user.business_id);

  if (error) return { error: error.message };
  revalidatePath('/instellingen');
  return { success: true };
}

export async function createCatalogItem(_prevState: { error?: string }, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const supabase = createClient();

  const name = (formData.get('name') as string)?.trim();
  const sellingPrice = parseFloat(formData.get('selling_price') as string);
  if (!name || isNaN(sellingPrice)) return { error: 'Naam en verkoopprijs zijn verplicht.' };

  const { error } = await supabase.from('catalog_repair_types').insert({
    business_id: user.business_id,
    name,
    category: (formData.get('category') as string) || null,
    brand: (formData.get('brand') as string) || null,
    model: (formData.get('model') as string) || null,
    selling_price: sellingPrice,
    vat_rate: parseFloat((formData.get('vat_rate') as string) || '21'),
    part_cost: parseFloat((formData.get('part_cost') as string) || '0'),
    labour_price: parseFloat((formData.get('labour_price') as string) || '0'),
    warranty_months: parseInt((formData.get('warranty_months') as string) || '3', 10),
    active: true,
  });

  if (error) return { error: error.message };
  revalidatePath('/instellingen');
  return { error: undefined };
}

export async function updateAccentColor(businessId: string, color: string) {
  const supabase = createClient();
  await supabase.from('businesses').update({ accent_color: color }).eq('id', businessId);
  revalidatePath('/instellingen', 'layout');
}

export async function uploadLogo(_prevState: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const supabase = createClient();

  const file = formData.get('logo') as File | null;
  if (!file || file.size === 0) return { error: 'Kies een afbeelding.' };
  if (file.size > 2 * 1024 * 1024) return { error: 'Bestand is te groot (max 2MB).' };

  const ext = file.name.split('.').pop() || 'png';
  const path = `${user.business_id}/logo.${ext}`;

  const { error: uploadError } = await supabase.storage.from('logos').upload(path, file, {
    upsert: true,
    contentType: file.type || 'image/png',
  });
  if (uploadError) return { error: uploadError.message };

  const { data: publicUrl } = supabase.storage.from('logos').getPublicUrl(path);
  // Cache-bust so the sidebar/PDFs pick up a replaced logo immediately.
  const url = `${publicUrl.publicUrl}?v=${Date.now()}`;

  const { error } = await supabase.from('businesses').update({ logo_url: url }).eq('id', user.business_id);
  if (error) return { error: error.message };

  revalidatePath('/instellingen', 'layout');
  return { error: undefined };
}

export async function toggleCatalogItem(id: string, active: boolean) {
  const supabase = createClient();
  await supabase.from('catalog_repair_types').update({ active }).eq('id', id);
  revalidatePath('/instellingen');
}

export async function createStatus(_prevState: { error?: string }, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const supabase = createClient();

  const name = (formData.get('name') as string)?.trim();
  if (!name) return { error: 'Naam is verplicht.' };

  const { data: existing } = await supabase
    .from('repair_statuses')
    .select('sort_order')
    .eq('business_id', user.business_id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from('repair_statuses').insert({
    business_id: user.business_id,
    name,
    color: (formData.get('color') as string) || '#495164',
    sort_order: (existing?.sort_order ?? 0) + 1,
    is_terminal: formData.get('is_terminal') === 'on',
    active: true,
  });
  if (error) return { error: error.message };
  revalidatePath('/instellingen');
  return { error: undefined };
}

export async function updateStatus(id: string, name: string, color: string) {
  const supabase = createClient();
  await supabase.from('repair_statuses').update({ name, color }).eq('id', id);
  revalidatePath('/instellingen');
}

export async function toggleStatusActive(id: string, active: boolean) {
  const supabase = createClient();
  await supabase.from('repair_statuses').update({ active }).eq('id', id);
  revalidatePath('/instellingen');
}

export async function moveStatus(statusId: string, direction: 'up' | 'down') {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const supabase = createClient();

  const { data: statuses } = await supabase
    .from('repair_statuses')
    .select('id, sort_order')
    .eq('business_id', user.business_id)
    .order('sort_order');
  if (!statuses) return;

  const index = statuses.findIndex((s) => s.id === statusId);
  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= statuses.length) return;

  const a = statuses[index];
  const b = statuses[swapIndex];
  await supabase.from('repair_statuses').update({ sort_order: b.sort_order }).eq('id', a.id);
  await supabase.from('repair_statuses').update({ sort_order: a.sort_order }).eq('id', b.id);
  revalidatePath('/instellingen');
}

/**
 * Adds a new terms version and deactivates the previous one. Old versions are
 * never deleted or edited — signatures already made keep referencing them
 * forever, per §15A.
 */
export async function createTermsVersion(_prevState: { error?: string }, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const supabase = createClient();

  const documentType = (formData.get('document_type') as string) || 'algemene_voorwaarden';
  const versionLabel = (formData.get('version_label') as string)?.trim();
  const content = (formData.get('content') as string)?.trim();
  const effectiveDate = (formData.get('effective_date') as string) || new Date().toISOString().slice(0, 10);

  if (!versionLabel || !content) return { error: 'Versienummer en tekst zijn verplicht.' };

  await supabase
    .from('terms_versions')
    .update({ is_active: false })
    .eq('business_id', user.business_id)
    .eq('document_type', documentType)
    .eq('is_active', true);

  const { error } = await supabase.from('terms_versions').insert({
    business_id: user.business_id,
    document_type: documentType,
    version_label: versionLabel,
    content,
    effective_date: effectiveDate,
    is_active: true,
  });

  if (error) return { error: error.message };
  revalidatePath('/instellingen');
  return { error: undefined };
}
