'use server';

import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function setDiagnosticResult(repairId: string, stage: 'pre' | 'post', item: string, result: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Niet ingelogd.' };

  const supabase = createClient();
  const { error } = await supabase.from('repair_diagnostics').upsert(
    {
      business_id: user.business_id,
      repair_id: repairId,
      stage,
      item,
      result,
      created_by: user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'repair_id,stage,item' }
  );
  if (error) return { error: error.message };

  revalidatePath(`/reparaties/${repairId}`);
  return { error: undefined };
}
