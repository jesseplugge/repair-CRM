'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

export type AcceptState = { error?: string; message?: string };

export async function signUpAndAccept(_prevState: AcceptState, formData: FormData): Promise<AcceptState> {
  const token = formData.get('token') as string;
  const email = formData.get('email') as string;
  const fullName = (formData.get('full_name') as string)?.trim();
  const password = formData.get('password') as string;
  const t = await getTranslations('acceptInviteErrors');
  if (!fullName) return { error: t('fillName') };
  if (!password || password.length < 8) return { error: t('choosePassword') };

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };

  if (!data.session) {
    return { message: t('confirmEmail') };
  }

  const { error: acceptError } = await supabase.rpc('accept_invite', { p_token: token, p_full_name: fullName });
  if (acceptError) return { error: acceptError.message };

  redirect('/dashboard');
}

export async function acceptAsExistingSession(_prevState: AcceptState, formData: FormData): Promise<AcceptState> {
  const token = formData.get('token') as string;
  const fullName = (formData.get('full_name') as string)?.trim();
  const t = await getTranslations('acceptInviteErrors');
  if (!fullName) return { error: t('fillName') };

  const supabase = createClient();
  const { error } = await supabase.rpc('accept_invite', { p_token: token, p_full_name: fullName });
  if (error) return { error: error.message };

  redirect('/dashboard');
}
