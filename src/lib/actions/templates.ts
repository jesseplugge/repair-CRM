'use server';

import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import { TEMPLATE_TYPES } from '@/lib/pdf/templates';

type TemplateState = { error?: string; success?: boolean };

export async function saveDocumentTemplate(_prevState: TemplateState, formData: FormData): Promise<TemplateState> {
  const user = await getCurrentUser();
  const t = await getTranslations('templateErrors');
  if (!user) return { error: t('notLoggedIn') };
  if (user.role !== 'owner') return { error: t('onlyOwnersCanEdit') };

  const type = formData.get('type') as string;
  if (!TEMPLATE_TYPES.includes(type as any)) return { error: t('invalidType') };

  const content: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key === 'type') continue;
    content[key] = String(value);
  }

  const supabase = createClient();
  const { data: existing } = await supabase
    .from('document_templates')
    .select('id')
    .eq('business_id', user.business_id)
    .eq('type', type)
    .limit(1)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from('document_templates').update({ content }).eq('id', existing.id)
    : await supabase.from('document_templates').insert({ business_id: user.business_id, type, format: 'a4', content, active: true });

  if (error) return { error: error.message };

  revalidatePath('/instellingen');
  return { success: true };
}
