'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export type AcceptState = { error?: string; message?: string };

export async function signUpAndAccept(_prevState: AcceptState, formData: FormData): Promise<AcceptState> {
  const token = formData.get('token') as string;
  const email = formData.get('email') as string;
  const fullName = (formData.get('full_name') as string)?.trim();
  const password = formData.get('password') as string;
  if (!fullName) return { error: 'Vul je naam in.' };
  if (!password || password.length < 8) return { error: 'Kies een wachtwoord van minstens 8 tekens.' };

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };

  if (!data.session) {
    return {
      message:
        'Controleer je e-mail om je account te bevestigen. Kom daarna terug naar deze link om je aan te sluiten bij het bedrijf.',
    };
  }

  const { error: acceptError } = await supabase.rpc('accept_invite', { p_token: token, p_full_name: fullName });
  if (acceptError) return { error: acceptError.message };

  redirect('/dashboard');
}

export async function acceptAsExistingSession(_prevState: AcceptState, formData: FormData): Promise<AcceptState> {
  const token = formData.get('token') as string;
  const fullName = (formData.get('full_name') as string)?.trim();
  if (!fullName) return { error: 'Vul je naam in.' };

  const supabase = createClient();
  const { error } = await supabase.rpc('accept_invite', { p_token: token, p_full_name: fullName });
  if (error) return { error: error.message };

  redirect('/dashboard');
}
