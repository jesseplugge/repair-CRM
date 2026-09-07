'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

type AuthState = { error?: string; message?: string };

export async function authenticate(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const mode = formData.get('mode') as string;
  const email = (formData.get('email') as string)?.trim();
  const password = formData.get('password') as string;
  const supabase = createClient();
  const t = await getTranslations('auth');

  if (!email || !password) {
    return { error: t('fillEmailPassword') };
  }

  if (mode === 'signup') {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (!data.session) {
      return { message: t('checkEmailToConfirm') };
    }
    redirect('/onboarding');
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: t('invalidCredentials') };
  redirect('/dashboard');
}
