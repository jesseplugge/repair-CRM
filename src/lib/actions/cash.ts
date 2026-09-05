'use server';

import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function getOpenCashSession() {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = createClient();
  const { data } = await supabase
    .from('cash_sessions')
    .select('*')
    .eq('business_id', user.business_id)
    .is('closed_at', null)
    .order('opened_at', { ascending: false })
    .maybeSingle();
  return data;
}

export async function openCashSession(_prevState: { error?: string }, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const supabase = createClient();

  const opening = parseFloat(formData.get('opening_amount') as string);
  if (isNaN(opening)) return { error: 'Vul een geldig startbedrag in.' };

  const { data: existing } = await supabase
    .from('cash_sessions')
    .select('id')
    .eq('business_id', user.business_id)
    .is('closed_at', null)
    .maybeSingle();
  if (existing) return { error: 'Er is al een open kassasessie.' };

  const { error } = await supabase.from('cash_sessions').insert({
    business_id: user.business_id,
    opened_by: user.id,
    opening_amount: opening,
  });
  if (error) return { error: error.message };

  revalidatePath('/kassa/kassalade');
  return { error: undefined };
}

export async function addCashMovement(_prevState: { error?: string }, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const supabase = createClient();

  const sessionId = formData.get('session_id') as string;
  const type = formData.get('type') as string;
  const amount = parseFloat(formData.get('amount') as string);
  if (isNaN(amount) || amount <= 0) return { error: 'Vul een geldig bedrag in.' };

  const { error } = await supabase.from('cash_movements').insert({
    cash_session_id: sessionId,
    type,
    amount,
    notes: (formData.get('notes') as string) || null,
  });
  if (error) return { error: error.message };

  revalidatePath('/kassa/kassalade');
  return { error: undefined };
}

/** Expected cash = opening + cash sales/deposits − cash refunds/withdrawals, computed from actual movements — never entered by hand. */
export async function closeCashSession(
  sessionId: string,
  actualAmount: number
): Promise<{ error?: string; expected?: number; difference?: number }> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const supabase = createClient();

  const { data: session } = await supabase.from('cash_sessions').select('*').eq('id', sessionId).single();
  if (!session) return { error: 'Sessie niet gevonden.' };

  const { data: movements } = await supabase.from('cash_movements').select('*').eq('cash_session_id', sessionId);
  const { data: cashPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('business_id', user.business_id)
    .eq('method', 'contant')
    .gte('paid_at', session.opened_at);

  const salesTotal = (cashPayments ?? []).reduce((s, p) => s + p.amount, 0);
  const deposits = (movements ?? []).filter((m) => m.type === 'deposit').reduce((s, m) => s + m.amount, 0);
  const withdrawals = (movements ?? []).filter((m) => m.type === 'withdrawal').reduce((s, m) => s + m.amount, 0);
  const refunds = (movements ?? []).filter((m) => m.type === 'refund').reduce((s, m) => s + m.amount, 0);

  const expected = session.opening_amount + salesTotal + deposits - withdrawals - refunds;
  const difference = Math.round((actualAmount - expected) * 100) / 100;

  const { error } = await supabase
    .from('cash_sessions')
    .update({
      closed_by: user.id,
      closed_at: new Date().toISOString(),
      closing_amount_expected: expected,
      closing_amount_actual: actualAmount,
      difference,
    })
    .eq('id', sessionId);
  if (error) return { error: error.message };

  revalidatePath('/kassa/kassalade');
  return { error: undefined, expected, difference };
}
