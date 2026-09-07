'use server';

import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const LABELS = ['front', 'back', 'left', 'right', 'top', 'bottom', 'damage'] as const;

export async function uploadRepairPhoto(_prevState: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Niet ingelogd.' };

  const repairId = formData.get('repair_id') as string;
  const label = (formData.get('label') as string) || null;
  const file = formData.get('photo') as File | null;
  if (!file || file.size === 0) return { error: 'Kies een foto.' };
  if (file.size > 8 * 1024 * 1024) return { error: 'Bestand is te groot (max 8MB).' };

  const supabase = createClient();
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${user.business_id}/${repairId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from('repair-photos').upload(path, file, {
    contentType: file.type || 'image/jpeg',
  });
  if (uploadError) return { error: uploadError.message };

  const { error } = await supabase.from('repair_photos').insert({
    business_id: user.business_id,
    repair_id: repairId,
    storage_path: path,
    label,
    created_by: user.id,
  });
  if (error) return { error: error.message };

  revalidatePath(`/reparaties/${repairId}`);
  return { error: undefined };
}

export async function deleteRepairPhoto(photoId: string, repairId: string) {
  const user = await getCurrentUser();
  if (!user) return;
  const supabase = createClient();

  const { data: photo } = await supabase.from('repair_photos').select('storage_path').eq('id', photoId).single();
  if (!photo) return;

  await supabase.storage.from('repair-photos').remove([photo.storage_path]);
  await supabase.from('repair_photos').delete().eq('id', photoId);

  revalidatePath(`/reparaties/${repairId}`);
}

export { LABELS as PHOTO_LABELS };
