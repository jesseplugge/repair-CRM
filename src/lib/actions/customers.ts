'use server';

import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export type CustomerFormState = { error?: string };

export async function createCustomer(_prevState: CustomerFormState, formData: FormData): Promise<CustomerFormState> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const supabase = createClient();

  const firstName = (formData.get('first_name') as string)?.trim();
  const lastName = (formData.get('last_name') as string)?.trim();
  if (!firstName || !lastName) return { error: 'Voornaam en achternaam zijn verplicht.' };

  const { data: customerNumber, error: numberError } = await supabase.rpc('next_number', {
    p_business_id: user.business_id,
    p_type: 'customer',
    p_year: 0,
    p_prefix: 'K-',
    p_pad: 6,
  });
  if (numberError) return { error: numberError.message };

  const { data: customer, error } = await supabase
    .from('customers')
    .insert({
      business_id: user.business_id,
      customer_number: customerNumber!,
      first_name: firstName,
      last_name: lastName,
      company_name: (formData.get('company_name') as string) || null,
      phone: (formData.get('phone') as string) || null,
      email: (formData.get('email') as string) || null,
      address: (formData.get('address') as string) || null,
      postcode: (formData.get('postcode') as string) || null,
      city: (formData.get('city') as string) || null,
      notes: (formData.get('notes') as string) || null,
    })
    .select('id')
    .single();

  if (error || !customer) return { error: error?.message ?? 'Aanmaken klant is mislukt.' };

  revalidatePath('/klanten');

  const redirectTo = formData.get('redirect_to') as string | null;
  redirect(redirectTo || `/klanten/${customer.id}`);
}

export type CustomerSearchResult = {
  id: string;
  customer_number: string;
  first_name: string;
  last_name: string;
  company_name: string | null;
  phone: string | null;
  email: string | null;
};

/** Used both by the /klanten list search and the fast-intake customer step. */
export async function searchCustomers(query: string): Promise<CustomerSearchResult[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = createClient();

  // Strip characters that are structurally significant in PostgREST's or() filter syntax.
  const q = query.trim().replace(/[,()]/g, ' ').trim();
  if (!q) {
    const { data } = await supabase
      .from('customers')
      .select('id, customer_number, first_name, last_name, company_name, phone, email')
      .eq('business_id', user.business_id)
      .order('created_at', { ascending: false })
      .limit(20);
    return data ?? [];
  }

  const { data } = await supabase
    .from('customers')
    .select('id, customer_number, first_name, last_name, company_name, phone, email')
    .eq('business_id', user.business_id)
    .or(
      `first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%,customer_number.ilike.%${q}%`
    )
    .limit(20);
  return data ?? [];
}
