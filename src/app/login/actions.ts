'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

type AuthState = { error?: string; message?: string };

export async function authenticate(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const mode = formData.get('mode') as string;
  const email = (formData.get('email') as string)?.trim();
  const password = formData.get('password') as string;
  const supabase = createClient();

  if (!email || !password) {
    return { error: 'Vul een e-mailadres en wachtwoord in.' };
  }

  if (mode === 'signup') {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (!data.session) {
      return { message: 'Controleer je e-mail om je account te bevestigen. Log daarna hieronder in.' };
    }
    redirect('/onboarding');
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: 'E-mailadres of wachtwoord onjuist.' };
  redirect('/dashboard');
}
