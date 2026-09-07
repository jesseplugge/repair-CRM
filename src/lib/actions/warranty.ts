'use server';

import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createWarrantyClaim(_prevState: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Niet ingelogd.' };

  const repairId = formData.get('repair_id') as string;
  const description = (formData.get('description') as string)?.trim();
  if (!description) return { error: 'Beschrijf de klacht.' };

  const supabase = createClient();
  const { data: claimNumber, error: numError } = await supabase.rpc('next_number', {
    p_business_id: user.business_id,
    p_type: 'warranty',
    p_year: new Date().getFullYear(),
    p_prefix: 'GAR-',
    p_pad: 4,
  });
  if (numError || !claimNumber) return { error: numError?.message ?? 'Kon geen claimnummer genereren.' };

  const { error } = await supabase.from('warranty_claims').insert({
    business_id: user.business_id,
    repair_id: repairId,
    claim_number: claimNumber,
    description,
    status: 'new',
    created_by: user.id,
  });
  if (error) return { error: error.message };

  revalidatePath(`/reparaties/${repairId}`);
  revalidatePath('/garantie');
  return { error: undefined };
}

const VALID_STATUSES = ['new', 'investigating', 'approved', 'rejected', 'repairing', 'resolved'];

export async function updateWarrantyClaimStatus(claimId: string, status: string, resolution?: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Niet ingelogd.' };
  if (!VALID_STATUSES.includes(status)) return { error: 'Ongeldige status.' };

  const supabase = createClient();
  const { data: claim, error } = await supabase
    .from('warranty_claims')
    .update({ status, resolution: resolution ?? null, updated_at: new Date().toISOString() })
    .eq('id', claimId)
    .select('repair_id')
    .single();
  if (error) return { error: error.message };

  revalidatePath(`/reparaties/${claim.repair_id}`);
  revalidatePath('/garantie');
  return { error: undefined };
}
