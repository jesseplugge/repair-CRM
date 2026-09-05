'use server';

import { createClient, getCurrentUser } from '@/lib/supabase/server';

export type PaymentTarget = {
  businessId: string;
  customerId: string | null;
  repairId?: string | null;
  invoiceId?: string | null;
  posSaleId?: string | null;
};

/** Inserts a payment row. Never stores card numbers or auth tokens — amount/method/notes only. */
export async function insertPayment(
  target: PaymentTarget,
  amount: number,
  method: string,
  notes?: string
): Promise<{ error?: string; payment?: { id: string } }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Niet ingelogd.' };
  const supabase = createClient();

  const { data: payment, error } = await supabase
    .from('payments')
    .insert({
      business_id: target.businessId,
      customer_id: target.customerId,
      repair_id: target.repairId ?? null,
      invoice_id: target.invoiceId ?? null,
      pos_sale_id: target.posSaleId ?? null,
      amount,
      method,
      notes: notes || null,
      created_by: user.id,
    })
    .select('id')
    .single();

  if (error || !payment) return { error: error?.message ?? 'Betaling registreren mislukt.' };
  return { payment };
}

export async function refundPayment(
  paymentId: string,
  amount: number,
  method: string,
  reason?: string
): Promise<{ error?: string; repairId?: string | null; invoiceId?: string | null; posSaleId?: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Niet ingelogd.' };
  const supabase = createClient();

  const { data: original } = await supabase.from('payments').select('*').eq('id', paymentId).single();
  if (!original) return { error: 'Oorspronkelijke betaling niet gevonden.' };

  const { error } = await supabase.from('refunds').insert({
    business_id: original.business_id,
    original_payment_id: paymentId,
    amount,
    method,
    reason: reason || null,
    created_by: user.id,
  });
  if (error) return { error: error.message };

  return { error: undefined, repairId: original.repair_id, invoiceId: original.invoice_id, posSaleId: original.pos_sale_id };
}
