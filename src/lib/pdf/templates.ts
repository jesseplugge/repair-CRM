import { createClient } from '@/lib/supabase/server';

export type DocumentTemplateType = 'dropoff' | 'completion' | 'receipt' | 'invoice';

export const TEMPLATE_TYPES: DocumentTemplateType[] = ['dropoff', 'completion', 'receipt', 'invoice'];

export const TEMPLATE_DEFAULTS: Record<DocumentTemplateType, Record<string, string>> = {
  dropoff: {
    termsNote: 'Dit is een geschatte prijs. De definitieve prijs kan afwijken na diagnose.',
    footerNote: '',
  },
  completion: { footerNote: '' },
  receipt: { footerNote: '' },
  invoice: { footerNote: '' },
};

/**
 * Reads the business's customization for a document type (Instellingen →
 * Documentsjablonen), falling back to the built-in defaults for any field
 * that hasn't been overridden. There's no uniqueness constraint on
 * (business_id, type) at the DB level — saveDocumentTemplate always
 * updates the existing row if one exists — but `limit(1)` guards against
 * ever throwing on a stray duplicate.
 */
export async function getTemplateContent(businessId: string, type: DocumentTemplateType): Promise<Record<string, string>> {
  const supabase = createClient();
  const { data } = await supabase
    .from('document_templates')
    .select('content')
    .eq('business_id', businessId)
    .eq('type', type)
    .eq('active', true)
    .limit(1);

  return { ...TEMPLATE_DEFAULTS[type], ...((data?.[0]?.content as Record<string, string> | undefined) ?? {}) };
}
