'use server';

import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export async function createIntakeSignature(
  repairId: string,
  signatureImage: string,
  checkboxConfirmed: boolean
): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!checkboxConfirmed) return { error: 'De klant moet akkoord gaan met de Algemene Voorwaarden.' };
  if (!signatureImage || signatureImage.length < 100) return { error: 'Handtekening ontbreekt.' };

  const supabase = createClient();

  const { data: repair } = await supabase
    .from('repairs')
    .select('id, business_id, customer_id, device_id, estimated_price, device_condition_snapshot')
    .eq('id', repairId)
    .eq('business_id', user.business_id)
    .single();
  if (!repair) return { error: 'Reparatie niet gevonden.' };

  // Snapshot every currently-active terms version — never the "current" pointer,
  // so this record keeps meaning even after new versions are uploaded later.
  const { data: activeTerms } = await supabase
    .from('terms_versions')
    .select('id, document_type, version_label, effective_date')
    .eq('business_id', user.business_id)
    .eq('is_active', true);

  if (!activeTerms || activeTerms.length === 0) {
    return { error: 'Geen actieve Algemene Voorwaarden ingesteld — ga naar Instellingen.' };
  }

  const ip = headers().get('x-forwarded-for')?.split(',')[0]?.trim() || null;

  const { error } = await supabase.from('intake_signatures').insert({
    business_id: repair.business_id,
    repair_id: repair.id,
    customer_id: repair.customer_id,
    device_id: repair.device_id,
    signed_by_user_id: user.id,
    signature_image: signatureImage,
    ip_address: ip,
    checkbox_confirmed: checkboxConfirmed,
    terms_accepted: activeTerms.map((t) => ({
      document_type: t.document_type,
      terms_version_id: t.id,
      version_label: t.version_label,
    })),
    estimated_price_at_signing: repair.estimated_price,
    device_condition_snapshot: repair.device_condition_snapshot ?? {},
  });

  if (error) return { error: error.message };

  await supabase.from('activity_logs').insert({
    business_id: repair.business_id,
    entity_type: 'repair',
    entity_id: repair.id,
    action: 'signed',
    description: 'Klant heeft getekend voor intake',
    performed_by: user.id,
  });

  return { error: undefined };
}

export async function getIntakeSignature(repairId: string) {
  const supabase = createClient();
  const { data } = await supabase.from('intake_signatures').select('*').eq('repair_id', repairId).order('created_at', { ascending: false }).limit(1).maybeSingle();
  return data;
}
