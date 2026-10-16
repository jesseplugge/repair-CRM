'use server';

import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { calculateFromExclVat, calculateFromInclVat, formatPaymentDescription } from '@/lib/utils/currency';
import { findOrCreateReceipt } from '@/lib/pdf/generate';
import { getTranslations } from 'next-intl/server';
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
  const t = await getTranslations('repairErrors');

  // 1. Resolve customer
  let customerId = formData.get('customer_id') as string | null;
  if (!customerId) {
    const firstName = (formData.get('new_customer_first_name') as string)?.trim();
    const lastName = (formData.get('new_customer_last_name') as string)?.trim();
    if (!firstName || !lastName) return { error: t('selectCustomerOrFillName') };

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
    if (custError || !newCustomer) return { error: custError?.message ?? t('createCustomerFailed') };
    customerId = newCustomer.id;
  }

  // 2. Resolve device
  let deviceId = formData.get('device_id') as string | null;
  if (!deviceId) {
    const brand = (formData.get('new_device_brand') as string)?.trim();
    const model = (formData.get('new_device_model') as string)?.trim();
    if (!brand || !model) return { error: t('selectDeviceOrFillBrand') };

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
    if (deviceError || !newDevice) return { error: deviceError?.message ?? t('createDeviceFailed') };
    deviceId = newDevice.id;
  }

  // 3. Resolve repair lines (any number of products, plus an optional manual line)
  const productIds = formData.getAll('product_id') as string[];
  type RepairItemInsert = {
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
  const items: RepairItemInsert[] = [];
  const { data: business } = await supabase
    .from('businesses')
    .select('default_warranty_months')
    .eq('id', businessId)
    .single();
  const warrantyMonths: number | null = business?.default_warranty_months ?? null;

  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds)
      .eq('business_id', businessId);
    for (const productId of productIds) {
      const product = products?.find((p) => p.id === productId);
      if (!product) return { error: t('catalogItemNotFound') };

      // The stored incl.-VAT price is what the customer pays; fall back to
      // deriving it only for products that predate that column.
      const { exclVat, inclVat } =
        product.selling_price_incl_vat != null
          ? calculateFromInclVat(product.selling_price_incl_vat, product.vat_rate)
          : calculateFromExclVat(product.selling_price_excl_vat, product.vat_rate);
      items.push({
        item_type: 'product',
        catalog_repair_type_id: null,
        product_id: product.id,
        description: product.name,
        cost_price_excl_vat: product.purchase_price_excl_vat ?? 0,
        selling_price_excl_vat: exclVat,
        vat_rate: product.vat_rate,
        total_excl_vat: exclVat,
        total_incl_vat: inclVat,
      });
    }
  }

  // The manual fields are only rendered when the tech opened the manual line.
  if (formData.has('manual_description')) {
    const description = (formData.get('manual_description') as string)?.trim();
    const priceRaw = parseFloat(formData.get('manual_price') as string);
    const vatRate = parseFloat((formData.get('manual_vat_rate') as string) ?? '21');
    const includesVat = formData.get('manual_price_includes_vat') === 'on';
    if (!description || isNaN(priceRaw)) return { error: t('fillDescriptionAndPrice') };

    const calc = includesVat ? calculateFromInclVat(priceRaw, vatRate) : calculateFromExclVat(priceRaw, vatRate);
    items.push({
      item_type: 'custom',
      catalog_repair_type_id: null,
      product_id: null,
      description,
      cost_price_excl_vat: 0,
      selling_price_excl_vat: calc.exclVat,
      vat_rate: vatRate,
      total_excl_vat: calc.exclVat,
      total_incl_vat: calc.inclVat,
    });
  }

  if (items.length === 0) return { error: t('fillDescriptionAndPrice') };
  const repairTypeLabel = items.map((i) => i.description).join(', ');

  // 4. Default status ('Nieuw')
  const { data: newStatus } = await supabase
    .from('repair_statuses')
    .select('id')
    .eq('business_id', businessId)
    .eq('name', 'Nieuw')
    .single();
  if (!newStatus) return { error: t('defaultStatusNotFound') };

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
      estimated_price: items.reduce((sum, i) => sum + i.total_incl_vat, 0),
      parts_cost: items.reduce((sum, i) => sum + i.cost_price_excl_vat, 0),
      labour_cost: 0,
      warranty_months: warrantyMonths,
      payment_status: 'open',
      created_by: user.id,
    })
    .select('id, repair_number')
    .single();

  if (repairError || !repair) return { error: repairError?.message ?? t('createRepairFailed') };

  // 7. Line items
  await supabase.from('repair_items').insert(items.map((i) => ({ repair_id: repair.id, ...i, quantity: 1, discount: 0 })));

  // 7b. Take used products out of stock. Like the kassa, a product at 0 stock
  // never blocks the repair; stock just stays at 0.
  for (const i of items) {
    if (!i.product_id) continue;
    const { data: product } = await supabase.from('products').select('stock_quantity').eq('id', i.product_id).single();
    if (!product) continue;
    const newQuantity = Math.max(0, product.stock_quantity - 1);
    const actualChange = newQuantity - product.stock_quantity;
    if (actualChange === 0) continue;
    await supabase.from('products').update({ stock_quantity: newQuantity }).eq('id', i.product_id);
    await supabase.from('stock_movements').insert({
      business_id: businessId,
      product_id: i.product_id,
      change: actualChange,
      reason: 'repair',
      related_repair_id: repair.id,
      created_by: user.id,
    });
  }

  // 8. Intake bon — logged immediately (not just lazily on first print/email) so it
  // shows up in Bonnen right away. The PDF itself is still rendered on demand from
  // live data whenever someone actually views/prints/emails it.
  await findOrCreateReceipt(businessId, user.id, 'intake', 'a4', { customer_id: customerId, repair_id: repair.id });

  // 9. Timeline entry
  await logActivity(supabase, businessId, repair.id, 'created', 'Reparatie aangemaakt', user.id);

  revalidatePath('/reparaties');
  revalidatePath('/dashboard');
  revalidatePath('/producten');
  revalidatePath('/voorraad');
  redirect(`/reparaties/${repair.id}`);
}

export async function updateRepairStatus(repairId: string, newStatusId: string) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const supabase = createClient();

  const t = await getTranslations('repairErrors');
  const { data: repair } = await supabase.from('repairs').select('id, business_id, customer_id, status_id').eq('id', repairId).single();
  if (!repair) return { error: t('repairNotFound') };

  const [{ data: oldStatus }, { data: newStatus }] = await Promise.all([
    supabase.from('repair_statuses').select('name').eq('id', repair.status_id).single(),
    supabase.from('repair_statuses').select('name, is_terminal').eq('id', newStatusId).single(),
  ]);
  if (!newStatus) return { error: t('statusNotFound') };
  const oldName = oldStatus?.name ?? 'onbekend';

  const patch: Database['public']['Tables']['repairs']['Update'] = {
    status_id: newStatusId,
    updated_at: new Date().toISOString(),
  };
  if (newStatus.name === 'Gereed') patch.date_completed = new Date().toISOString();
  if (newStatus.name === 'Opgehaald') patch.date_picked_up = new Date().toISOString();

  const { error } = await supabase.from('repairs').update(patch).eq('id', repairId);
  if (error) return { error: error.message };

  if (newStatus.name === 'Gereed') {
    // Kassabon — logged as soon as the repair is ready for pickup, same reasoning
    // as the intake bon above: it should show up in Bonnen without anyone having
    // to manually print/email it first.
    await findOrCreateReceipt(repair.business_id, user.id, 'repair_completion', 'a4', {
      customer_id: repair.customer_id,
      repair_id: repair.id,
    });
  }

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

export async function updateRepairDetails(repairId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const supabase = createClient();
  const t = await getTranslations('repairErrors');

  const { data: repair } = await supabase
    .from('repairs')
    .select('id, business_id')
    .eq('id', repairId)
    .eq('business_id', user.business_id)
    .single();
  if (!repair) return { error: t('repairNotFound') };

  const dateReceivedRaw = formData.get('date_received') as string;
  if (!dateReceivedRaw) return { error: t('dateReceivedRequired') };
  const dateReceived = new Date(dateReceivedRaw);
  if (isNaN(dateReceived.getTime())) return { error: t('invalidDate') };

  const dateCompletedRaw = (formData.get('date_completed') as string) || '';
  const dateCompleted = dateCompletedRaw ? new Date(dateCompletedRaw) : null;
  if (dateCompletedRaw && isNaN(dateCompleted!.getTime())) return { error: t('invalidDate') };

  const datePickedUpRaw = (formData.get('date_picked_up') as string) || '';
  const datePickedUp = datePickedUpRaw ? new Date(datePickedUpRaw) : null;
  if (datePickedUpRaw && isNaN(datePickedUp!.getTime())) return { error: t('invalidDate') };

  const warrantyMonthsRaw = (formData.get('warranty_months') as string) || '';
  const warrantyMonths = warrantyMonthsRaw ? parseInt(warrantyMonthsRaw, 10) : null;
  if (warrantyMonthsRaw && isNaN(warrantyMonths as number)) return { error: t('invalidWarrantyMonths') };

  const patch: Database['public']['Tables']['repairs']['Update'] = {
    date_received: dateReceived.toISOString(),
    date_completed: dateCompleted ? dateCompleted.toISOString() : null,
    date_picked_up: datePickedUp ? datePickedUp.toISOString() : null,
    customer_complaint: (formData.get('customer_complaint') as string)?.trim() || null,
    technician_notes: (formData.get('technician_notes') as string)?.trim() || null,
    warranty_months: warrantyMonths,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('repairs').update(patch).eq('id', repairId);
  if (error) return { error: error.message };

  await logActivity(supabase, repair.business_id, repairId, 'details_updated', 'Reparatiegegevens bijgewerkt', user.id);

  revalidatePath(`/reparaties/${repairId}`);
  revalidatePath('/reparaties');
  return { error: undefined };
}

/**
 * Un-signs a repair intake. Used to correct a signature captured by mistake
 * (wrong customer, wrong device) — the customer can then sign again from the
 * repair page.
 */
export async function removeIntakeSignature(repairId: string) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const supabase = createClient();
  const t = await getTranslations('repairErrors');

  const { data: repair } = await supabase
    .from('repairs')
    .select('id, business_id')
    .eq('id', repairId)
    .eq('business_id', user.business_id)
    .single();
  if (!repair) return { error: t('repairNotFound') };

  const { error } = await supabase.from('intake_signatures').delete().eq('repair_id', repairId);
  if (error) return { error: error.message };

  await logActivity(supabase, repair.business_id, repairId, 'signature_removed', 'Handtekening verwijderd', user.id);

  revalidatePath(`/reparaties/${repairId}`);
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
  const priceIncludesVat = formData.get('price_includes_vat') === 'on';
  if (!description || isNaN(priceRaw)) {
    const t = await getTranslations('repairErrors');
    return { error: t('descriptionAndPriceRequired') };
  }

  // priceRaw is a per-unit price. selling_price_excl_vat is kept as an
  // informational per-unit reference, but the line totals are what gets
  // charged/shown — when the tech entered an incl.-VAT price, base the total
  // directly on that incl.-VAT amount (like the POS checkout does) rather
  // than converting to excl.-VAT and back, which can round to a different
  // cent (e.g. 79,95 incl. at 21% has no excl.-VAT value that converts back
  // to it exactly).
  const unitExclVat = priceIncludesVat ? calculateFromInclVat(priceRaw, vatRate).exclVat : priceRaw;
  const { exclVat, inclVat } = priceIncludesVat
    ? calculateFromInclVat(priceRaw * quantity, vatRate)
    : calculateFromExclVat(unitExclVat * quantity, vatRate);

  const { error } = await supabase.from('repair_items').insert({
    repair_id: repairId,
    item_type: itemType,
    description,
    quantity,
    cost_price_excl_vat: 0,
    selling_price_excl_vat: unitExclVat,
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
export async function recordRepairPayment(
  repairId: string,
  amount: number,
  method: string,
  notes?: string,
  extras?: { transactionId?: string | null; tipAmount?: number }
) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const supabase = createClient();

  const { data: repair } = await supabase
    .from('repairs')
    .select('business_id, customer_id')
    .eq('id', repairId)
    .single();
  if (!repair) {
    const t = await getTranslations('repairErrors');
    return { error: t('repairNotFound') };
  }

  const { insertPayment } = await import('./payments');
  const result = await insertPayment(
    { businessId: repair.business_id, customerId: repair.customer_id, repairId },
    amount,
    method,
    notes,
    extras
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

/** Edits a payment's amount/method/reference/tip/time/notes directly, then recomputes the repair's payment_status. */
export async function updateRepairPayment(
  repairId: string,
  paymentId: string,
  fields: { amount: number; method: string; transactionId?: string | null; tipAmount?: number; paidAt: string; notes?: string | null }
) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const supabase = createClient();
  const t = await getTranslations('repairErrors');

  const date = new Date(fields.paidAt);
  if (isNaN(date.getTime())) return { error: t('invalidDate') };

  const { updatePayment } = await import('./payments');
  const result = await updatePayment(paymentId, { ...fields, paidAt: date.toISOString() });
  if (result.error) return { error: result.error };

  const { data: repair } = await supabase.from('repairs').select('business_id').eq('id', repairId).single();
  if (repair) {
    await recalculateRepairPaymentStatus(repairId);
    await logActivity(supabase, repair.business_id, repairId, 'payment_edited', 'Betaling aangepast', user.id);
  }

  revalidatePath(`/reparaties/${repairId}`);
  revalidatePath('/dashboard');
  return { error: undefined };
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

/**
 * Deletes a repair and everything tied to it — payments, the signed intake,
 * warranty claims, photos, diagnostics, receipts, and activity log entries.
 * The one exception is an invoice: invoices are legal bookkeeping records
 * with their own sequential numbering (VAT retention requirements), so an
 * invoice generated from this repair is kept and just unlinked rather than
 * deleted. repair_items/repair_photos/repair_diagnostics/warranty_claims
 * cascade-delete at the DB level; everything else is cleaned up explicitly
 * here since those tables have no ON DELETE CASCADE to repairs.
 */
export async function deleteRepair(repairId: string) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const supabase = createClient();
  const t = await getTranslations('repairErrors');

  const { data: repair } = await supabase
    .from('repairs')
    .select('id, business_id')
    .eq('id', repairId)
    .eq('business_id', user.business_id)
    .single();
  if (!repair) return { error: t('repairNotFound') };

  await supabase.from('invoices').update({ repair_id: null }).eq('repair_id', repairId);

  const { data: payments } = await supabase.from('payments').select('id').eq('repair_id', repairId);
  const paymentIds = (payments ?? []).map((p) => p.id);
  if (paymentIds.length > 0) {
    await supabase.from('refunds').delete().in('original_payment_id', paymentIds);
    await supabase.from('payments').delete().in('id', paymentIds);
  }

  await supabase.from('intake_signatures').delete().eq('repair_id', repairId);

  const { data: photos } = await supabase.from('repair_photos').select('storage_path').eq('repair_id', repairId);
  if (photos && photos.length > 0) {
    await supabase.storage.from('repair-photos').remove(photos.map((p) => p.storage_path));
  }

  await supabase.from('receipts').delete().eq('repair_id', repairId);
  await supabase.from('activity_logs').delete().eq('entity_type', 'repair').eq('entity_id', repairId);

  const { error } = await supabase.from('repairs').delete().eq('id', repairId);
  if (error) return { error: error.message };

  revalidatePath('/reparaties');
  revalidatePath('/dashboard');
  revalidatePath('/facturen');
  return { error: undefined };
}

export async function searchCatalog(query: string, businessId: string) {
  const supabase = createClient();
  const q = query.trim().replace(/[,()]/g, ' ').trim();
  let request = supabase
    .from('products')
    .select('id, name, sku, selling_price_excl_vat, selling_price_incl_vat, vat_rate')
    .eq('business_id', businessId)
    .eq('active', true)
    .order('name');
  if (q) request = request.or(`name.ilike.%${q}%,sku.ilike.%${q}%`);
  const { data } = await request.limit(15);
  return data ?? [];
}
