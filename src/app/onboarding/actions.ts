'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function createBusiness(_prevState: { error?: string }, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const legalName = (formData.get('legal_name') as string)?.trim();
  const fullName = (formData.get('full_name') as string)?.trim();
  if (!legalName || !fullName) return { error: 'Bedrijfsnaam en jouw naam zijn verplicht.' };

  const { error } = await supabase.rpc('create_business_and_owner', {
    p_legal_name: legalName,
    p_trading_name: (formData.get('trading_name') as string) || null,
    p_address: (formData.get('address') as string) || null,
    p_postcode: (formData.get('postcode') as string) || null,
    p_city: (formData.get('city') as string) || null,
    p_phone: (formData.get('phone') as string) || null,
    p_email: (formData.get('email') as string) || null,
    p_kvk_number: (formData.get('kvk_number') as string) || null,
    p_vat_number: (formData.get('vat_number') as string) || null,
    p_iban: (formData.get('iban') as string) || null,
    p_full_name: fullName,
  });

  if (error) return { error: error.message };

  redirect('/dashboard');
}
