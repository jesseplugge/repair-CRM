'use server';

import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';

type InviteState = { error?: string; inviteUrl?: string; emailSent?: boolean };

function baseUrl() {
  const h = headers();
  const proto = h.get('x-forwarded-proto') ?? 'https';
  return `${proto}://${h.get('host')}`;
}

export async function createInvite(_prevState: InviteState, formData: FormData): Promise<InviteState> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const t = await getTranslations('inviteErrors');
  if (user.role !== 'owner') return { error: t('onlyOwnersCanInvite') };

  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const role = (formData.get('role') as string) === 'owner' ? 'owner' : 'employee';
  if (!email) return { error: t('fillEmail') };

  const supabase = createClient();

  const { data: existingMember } = await supabase.from('users').select('id').eq('business_id', user.business_id).eq('email', email).maybeSingle();
  if (existingMember) return { error: t('emailAlreadyLinked') };

  const { data: invite, error } = await supabase
    .from('invites')
    .insert({ business_id: user.business_id, email, role, invited_by: user.id })
    .select('token')
    .single();
  if (error) return { error: error.message };

  const inviteUrl = `${baseUrl()}/uitnodiging/${invite.token}`;

  const { data: business } = await supabase.from('businesses').select('trading_name, legal_name').eq('id', user.business_id).single();
  const businessName = business?.trading_name || business?.legal_name || t('defaultBusinessName');

  const emailResult = await sendEmail({
    to: email,
    subject: t('emailSubject', { businessName }),
    html: `<p>${t('emailGreeting')}</p><p>${t('emailBody', { businessName })}</p><p><a href="${inviteUrl}">${t('emailLink')}</a></p><p>${t('emailExpiry')}</p>`,
  });

  revalidatePath('/instellingen');
  return { inviteUrl, emailSent: !emailResult.error };
}

export async function revokeInvite(inviteId: string) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const t = await getTranslations('inviteErrors');
  if (user.role !== 'owner') return { error: t('onlyOwnersCanRevoke') };

  const supabase = createClient();
  await supabase.from('invites').delete().eq('id', inviteId).eq('business_id', user.business_id);
  revalidatePath('/instellingen');
}
