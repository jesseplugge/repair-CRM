'use server';

import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export type DeviceFormState = { error?: string };

export async function createDevice(_prevState: DeviceFormState, formData: FormData): Promise<DeviceFormState> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const supabase = createClient();

  const customerId = formData.get('customer_id') as string;
  const brand = (formData.get('brand') as string)?.trim();
  const model = (formData.get('model') as string)?.trim();
  if (!customerId || !brand || !model) return { error: 'Merk en model zijn verplicht.' };

  const { data: device, error } = await supabase
    .from('devices')
    .insert({
      business_id: user.business_id,
      customer_id: customerId,
      brand,
      model,
      imei: (formData.get('imei') as string) || null, // never required — see §5
      serial_number: (formData.get('serial_number') as string) || null,
      color: (formData.get('color') as string) || null,
      storage_capacity: (formData.get('storage_capacity') as string) || null,
      condition_notes: (formData.get('condition_notes') as string) || null,
      existing_damage: (formData.get('existing_damage') as string) || null,
      notes: (formData.get('notes') as string) || null,
    })
    .select('id')
    .single();

  if (error || !device) return { error: error?.message ?? 'Aanmaken apparaat is mislukt.' };

  revalidatePath(`/klanten/${customerId}`);

  const redirectTo = formData.get('redirect_to') as string | null;
  if (redirectTo) redirect(`${redirectTo}?device_id=${device.id}`);
  redirect(`/klanten/${customerId}`);
}

export async function getCustomerDevices(customerId: string) {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = createClient();
  const { data } = await supabase
    .from('devices')
    .select('*')
    .eq('business_id', user.business_id)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  return data ?? [];
}
