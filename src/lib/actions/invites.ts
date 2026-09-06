'use server';

import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

type InviteState = { error?: string; inviteUrl?: string; emailSent?: boolean };

function baseUrl() {
  const h = headers();
  const proto = h.get('x-forwarded-proto') ?? 'https';
  return `${proto}://${h.get('host')}`;
}

export async function createInvite(_prevState: InviteState, formData: FormData): Promise<InviteState> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'owner') return { error: 'Alleen eigenaren kunnen teamleden uitnodigen.' };

  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const role = (formData.get('role') as string) === 'owner' ? 'owner' : 'employee';
  if (!email) return { error: 'Vul een e-mailadres in.' };

  const supabase = createClient();

  const { data: existingMember } = await supabase.from('users').select('id').eq('business_id', user.business_id).eq('email', email).maybeSingle();
  if (existingMember) return { error: 'Dit e-mailadres is al gekoppeld aan een teamlid.' };

  const { data: invite, error } = await supabase
    .from('invites')
    .insert({ business_id: user.business_id, email, role, invited_by: user.id })
    .select('token')
    .single();
  if (error) return { error: error.message };

  const inviteUrl = `${baseUrl()}/uitnodiging/${invite.token}`;

  const { data: business } = await supabase.from('businesses').select('trading_name, legal_name').eq('id', user.business_id).single();
  const businessName = business?.trading_name || business?.legal_name || 'het bedrijf';

  const emailResult = await sendEmail({
    to: email,
    subject: `Uitnodiging voor ${businessName}`,
    html: `<p>Beste,</p><p>Je bent uitgenodigd om je aan te sluiten bij <strong>${businessName}</strong> op Reparatie CRM.</p><p><a href="${inviteUrl}">Klik hier om de uitnodiging te accepteren</a></p><p>Deze link is 7 dagen geldig.</p>`,
  });

  revalidatePath('/instellingen');
  return { inviteUrl, emailSent: !emailResult.error };
}

export async function revokeInvite(inviteId: string) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'owner') return { error: 'Alleen eigenaren kunnen uitnodigingen intrekken.' };

  const supabase = createClient();
  await supabase.from('invites').delete().eq('id', inviteId).eq('business_id', user.business_id);
  revalidatePath('/instellingen');
}
