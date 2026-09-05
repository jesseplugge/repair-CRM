'use server';

import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { calculateFromExclVat, calculateFromInclVat, formatPaymentDescription } from '@/lib/utils/currency';
import type { Database, Json } from '@/lib/types/database';

export type RepairFormState = { error?: string };

async function logActivity(
  supabase: ReturnType<typeof createClient>,
  businessId: string,
  repairId: string,
  action: string,
  description: string,
  userId: string,
  old_value: Json = null,
  new_value: Json = null
) {
  await supabase.from('activity_logs').insert({
    business_id: businessId,
    entity_type: 'repair',
    entity_id: repairId,
    action,
    description,
    old_value,
    new_value,
    performed_by: userId,
  });
}

/**
 * Single-page fast intake: creates the customer and/or device inline if they
 * don't exist yet, resolves the repair type from the catalogue (or takes a
 * manual line), and creates the repair — all in one submit, per §39.
 */
export async function createRepair(_prevState: RepairFormState, formData: FormData): Promise<RepairFormState> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const supabase = createClient();
  const businessId = user.business_id;

  // 1. Resolve customer
  let customerId = formData.get('customer_id') as string | null;
  if (!customerId) {
    const firstName = (formData.get('new_customer_first_name') as string)?.trim();
    const lastName = (formData.get('new_customer_last_name') as string)?.trim();
    if (!firstName || !lastName) return { error: 'Selecteer een klant of vul voor- en achternaam in.' };

    const { data: customerNumber, error: numError } = await supabase.rpc('next_number', {
      p_business_id: businessId,
      p_type: 'customer',
      p_year: 0,
      p_prefix: 'K-',
      p_pad: 6,
    });
    if (numError) return { error: numError.message };

    const { data: newCustomer, error: custError } = await supabase
      .from('customers')
      .insert({
        business_id: businessId,
        customer_number: customerNumber!,
        first_name: firstName,
        last_name: lastName,
        phone: (formData.get('new_customer_phone') as string) || null,
        email: (formData.get('new_customer_email') as string) || null,
      })
      .select('id')
      .single();
    if (custError || !newCustomer) return { error: custError?.message ?? 'Aanmaken klant mislukt.' };
    customerId = newCustomer.id;
  }

  // 2. Resolve device
  let deviceId = formData.get('device_id') as string | null;
  if (!deviceId) {
    const brand = (formData.get('new_device_brand') as string)?.trim();
    const model = (formData.get('new_device_model') as string)?.trim();
    if (!brand || !model) return { error: 'Selecteer een apparaat of vul merk en model in.' };

    const { data: newDevice, error: deviceError } = await supabase
      .from('devices')
      .insert({
        business_id: businessId,
        customer_id: customerId,
        brand,
        model,
        imei: (formData.get('new_device_imei') as string) || null,
        color: (formData.get('new_device_color') as string) || null,
        storage_capacity: (formData.get('new_device_storage') as string) || null,
        existing_damage: (formData.get('new_device_damage') as string) || null,
      })
      .select('id')
      .single();
    if (deviceError || !newDevice) return { error: deviceError?.message ?? 'Aanmaken apparaat mislukt.' };
    deviceId = newDevice.id;
  }

  // 3. Resolve repair line (catalogue item or manual)
  const catalogId = formData.get('catalog_repair_type_id') as string | null;
  let repairTypeLabel: string;
  let item: {
    item_type: string;
    catalog_repair_type_id: string | null;
    product_id: string | null;
    description: string;
    cost_price_excl_vat: number;
    selling_price_excl_vat: number;
    vat_rate: number;
    total_excl_vat: number;
    total_incl_vat: number;
  };
  const { data: business } = await supabase
    .from('businesses')
    .select('default_warranty_months')
    .eq('id', businessId)
    .single();
  let warrantyMonths: number | null = business?.default_warranty_months ?? null;

  if (catalogId) {
    const { data: catalogItem } = await supabase
      .from('catalog_repair_types')
      .select('*')
      .eq('id', catalogId)
      .eq('business_id', businessId)
      .single();
    if (!catalogItem) return { error: 'Gekozen reparatietype niet gevonden.' };

    const { exclVat, inclVat } = calculateFromExclVat(catalogItem.selling_price, catalogItem.vat_rate);
    repairTypeLabel = catalogItem.name;
    item = {
      item_type: 'service',
      catalog_repair_type_id: catalogItem.id,
      product_id: catalogItem.default_product_id,
      description: catalogItem.name,
      cost_price_excl_vat: (catalogItem.part_cost ?? 0) + (catalogItem.labour_price ?? 0),
      selling_price_excl_vat: exclVat,
      vat_rate: catalogItem.vat_rate,
      total_excl_vat: exclVat,
      total_incl_vat: inclVat,
    };
    warrantyMonths = catalogItem.warranty_months ?? warrantyMonths;
  } else {
    const description = (formData.get('manual_description') as string)?.trim();
    const priceRaw = parseFloat(formData.get('manual_price') as string);
    const vatRate = parseFloat((formData.get('manual_vat_rate') as string) ?? '21');
    const includesVat = formData.get('manual_price_includes_vat') === 'on';
    if (!description || isNaN(priceRaw)) return { error: 'Vul een omschrijving en prijs in voor de reparatie.' };

    const calc = includesVat ? calculateFromInclVat(priceRaw, vatRate) : calculateFromExclVat(priceRaw, vatRate);
    repairTypeLabel = description;
    item = {
      item_type: 'custom',
      catalog_repair_type_id: null,
      product_id: null,
      description,
      cost_price_excl_vat: 0,
      selling_price_excl_vat: calc.exclVat,
      vat_rate: vatRate,
      total_excl_vat: calc.exclVat,
      total_incl_vat: calc.inclVat,
    };
  }

  // 4. Default status ('Nieuw')
  const { data: newStatus } = await supabase
    .from('repair_statuses')
    .select('id')
    .eq('business_id', businessId)
    .eq('name', 'Nieuw')
    .single();
  if (!newStatus) return { error: 'Standaardstatus "Nieuw" niet gevonden — controleer Instellingen.' };

  // 5. Repair number
  const year = new Date().getFullYear();
  const { data: repairNumber, error: numberError } = await supabase.rpc('next_number', {
    p_business_id: businessId,
    p_type: 'repair',
    p_year: year,
    p_prefix: 'REP-',
    p_pad: 4,
  });
  if (numberError) return { error: numberError.message };

  const deviceCondition = {
    screen_damage: formData.get('cond_screen') === 'on',
    back_glass_damage: formData.get('cond_back') === 'on',
    frame_damage: formData.get('cond_frame') === 'on',
    camera_damage: formData.get('cond_camera') === 'on',
    buttons_damage: formData.get('cond_buttons') === 'on',
    charging_port_damage: formData.get('cond_port') === 'on',
    water_damage: formData.get('cond_water') === 'on',
    other_notes: (formData.get('cond_other') as string) || null,
  };

  // 6. Create repair
  const { data: repair, error: repairError } = await supabase
    .from('repairs')
    .insert({
      business_id: businessId,
      repair_number: repairNumber!,
      customer_id: customerId,
      device_id: deviceId,
      status_id: newStatus.id,
      repair_type_label: repairTypeLabel,
      customer_complaint: (formData.get('customer_complaint') as string) || null,
      technician_notes: (formData.get('technician_notes') as string) || null,
      device_condition_snapshot: deviceCondition,
      estimated_price: item.total_incl_vat,
      parts_cost: item.cost_price_excl_vat,
      labour_cost: 0,
      warranty_months: warrantyMonths,
      payment_status: 'open',
      created_by: user.id,
    })
    .select('id, repair_number')
    .single();

  if (repairError || !repair) return { error: repairError?.message ?? 'Aanmaken reparatie mislukt.' };

  // 7. Line item
  await supabase.from('repair_items').insert({ repair_id: repair.id, ...item, quantity: 1, discount: 0 });

  // 8. Timeline entry
  await logActivity(supabase, businessId, repair.id, 'created', 'Reparatie aangemaakt', user.id);

  revalidatePath('/reparaties');
  revalidatePath('/dashboard');
  redirect(`/reparaties/${repair.id}`);
}

export async function updateRepairStatus(repairId: string, newStatusId: string) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const supabase = createClient();

  const { data: repair } = await supabase.from('repairs').select('id, business_id, status_id').eq('id', repairId).single();
  if (!repair) return { error: 'Reparatie niet gevonden.' };

  const [{ data: oldStatus }, { data: newStatus }] = await Promise.all([
    supabase.from('repair_statuses').select('name').eq('id', repair.status_id).single(),
    supabase.from('repair_statuses').select('name, is_terminal').eq('id', newStatusId).single(),
  ]);
  if (!newStatus) return { error: 'Status niet gevonden.' };
  const oldName = oldStatus?.name ?? 'onbekend';

  const patch: Database['public']['Tables']['repairs']['Update'] = {
    status_id: newStatusId,
    updated_at: new Date().toISOString(),
  };
  if (newStatus.name === 'Gereed') patch.date_completed = new Date().toISOString();
  if (newStatus.name === 'Opgehaald') patch.date_picked_up = new Date().toISOString();

  const { error } = await supabase.from('repairs').update(patch).eq('id', repairId);
  if (error) return { error: error.message };

  await logActivity(
    supabase,
    repair.business_id,
    repairId,
    'status_change',
    `Status → ${newStatus.name}`,
    user.id,
    { status: oldName },
    { status: newStatus.name }
  );

  revalidatePath(`/reparaties/${repairId}`);
  revalidatePath('/reparaties');
  revalidatePath('/dashboard');
  return { error: undefined };
}

export async function addRepairItem(repairId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const supabase = createClient();

  const description = (formData.get('description') as string)?.trim();
  const quantity = parseFloat((formData.get('quantity') as string) || '1');
  const priceRaw = parseFloat(formData.get('price') as string);
  const vatRate = parseFloat((formData.get('vat_rate') as string) || '21');
  const itemType = (formData.get('item_type') as string) || 'custom';
  if (!description || isNaN(priceRaw)) return { error: 'Omschrijving en prijs zijn verplicht.' };

  const { exclVat, inclVat } = calculateFromExclVat(priceRaw * quantity, vatRate);

  const { error } = await supabase.from('repair_items').insert({
    repair_id: repairId,
    item_type: itemType,
    description,
    quantity,
    cost_price_excl_vat: 0,
    selling_price_excl_vat: priceRaw,
    vat_rate: vatRate,
    discount: 0,
    total_excl_vat: exclVat,
    total_incl_vat: inclVat,
  });
  if (error) return { error: error.message };

  await recalculateRepairTotal(repairId);
  revalidatePath(`/reparaties/${repairId}`);
  return { error: undefined };
}

export async function removeRepairItem(repairId: string, itemId: string) {
  const supabase = createClient();
  await supabase.from('repair_items').delete().eq('id', itemId);
  await recalculateRepairTotal(repairId);
  revalidatePath(`/reparaties/${repairId}`);
}

async function recalculateRepairTotal(repairId: string) {
  const supabase = createClient();
  const { data: items } = await supabase.from('repair_items').select('total_incl_vat').eq('repair_id', repairId);
  const total = (items ?? []).reduce((sum, i) => sum + i.total_incl_vat, 0);
  await supabase.from('repairs').update({ estimated_price: total }).eq('id', repairId);
}

/**
 * Records a payment against a repair via the payments ledger (supports
 * partial/split payments, per §11/§13) and recomputes payment_status from
 * the actual sum of payments minus refunds — never stored as a flag alone.
 */
export async function recordRepairPayment(repairId: string, amount: number, method: string, notes?: string) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const supabase = createClient();

  const { data: repair } = await supabase
    .from('repairs')
    .select('business_id, customer_id')
    .eq('id', repairId)
    .single();
  if (!repair) return { error: 'Reparatie niet gevonden.' };

  const { insertPayment } = await import('./payments');
  const result = await insertPayment(
    { businessId: repair.business_id, customerId: repair.customer_id, repairId },
    amount,
    method,
    notes
  );
  if (result.error) return { error: result.error };

  await recalculateRepairPaymentStatus(repairId);
  await logActivity(supabase, repair.business_id, repairId, 'payment', formatPaymentDescription(amount, method), user.id);

  revalidatePath(`/reparaties/${repairId}`);
  revalidatePath('/dashboard');
  return { error: undefined };
}

export async function getRepairPayments(repairId: string) {
  const supabase = createClient();
  const { data } = await supabase.from('payments').select('*').eq('repair_id', repairId).order('paid_at', { ascending: false });
  return data ?? [];
}

async function recalculateRepairPaymentStatus(repairId: string) {
  const supabase = createClient();
  const [{ data: items }, { data: payments }] = await Promise.all([
    supabase.from('repair_items').select('total_incl_vat').eq('repair_id', repairId),
    supabase.from('payments').select('id, amount, method, paid_at').eq('repair_id', repairId).order('paid_at', { ascending: false }),
  ]);
  const total = (items ?? []).reduce((s, i) => s + i.total_incl_vat, 0);

  let refundTotal = 0;
  if (payments && payments.length > 0) {
    const { data: refunds } = await supabase
      .from('refunds')
      .select('amount, original_payment_id')
      .in('original_payment_id', payments.map((p) => p.id));
    refundTotal = (refunds ?? []).reduce((s, r) => s + r.amount, 0);
  }

  const paidTotal = (payments ?? []).reduce((s, p) => s + p.amount, 0) - refundTotal;
  const status = paidTotal <= 0.005 ? 'open' : paidTotal < total - 0.005 ? 'partial' : 'paid';
  const lastMethod = payments && payments[0] ? payments[0].method : null;

  await supabase
    .from('repairs')
    .update({
      payment_status: status,
      payment_method: lastMethod,
      final_price: status === 'paid' ? total : null,
    })
    .eq('id', repairId);
}

export async function refundRepairPayment(repairId: string, paymentId: string, amount: number, method: string) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const supabase = createClient();
  const { refundPayment } = await import('./payments');

  const result = await refundPayment(paymentId, amount, method);
  if (result.error) return { error: result.error };

  const { data: repair } = await supabase.from('repairs').select('business_id').eq('id', repairId).single();
  if (repair) {
    await recalculateRepairPaymentStatus(repairId);
    await logActivity(
      supabase,
      repair.business_id,
      repairId,
      'refund',
      `Terugbetaling ${new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount)}`,
      user.id
    );
  }

  revalidatePath(`/reparaties/${repairId}`);
  return { error: undefined };
}

export async function searchCatalog(query: string, businessId: string) {
  const supabase = createClient();
  const q = query.trim().replace(/[,()]/g, ' ').trim();
  let request = supabase.from('catalog_repair_types').select('*').eq('business_id', businessId).eq('active', true);
  if (q) request = request.or(`name.ilike.%${q}%,brand.ilike.%${q}%,model.ilike.%${q}%`);
  const { data } = await request.limit(15);
  return data ?? [];
}
