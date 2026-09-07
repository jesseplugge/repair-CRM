'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';
import { saveDocumentTemplate } from '@/lib/actions/templates';
import { Button, Card, Field, Textarea } from '@/components/ui/primitives';
import type { DocumentTemplateType } from '@/lib/pdf/templates';

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations('documentTemplates');
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? t('saving') : t('save')}
    </Button>
  );
}

function TemplateForm({
  type,
  title,
  description,
  fields,
  values,
  canEdit,
}: {
  type: DocumentTemplateType;
  title: string;
  description: string;
  fields: { name: string; label: string; placeholder?: string }[];
  values: Record<string, string>;
  canEdit: boolean;
}) {
  const [state, formAction] = useFormState(saveDocumentTemplate, { error: '' });
  const t = useTranslations('documentTemplates');

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
      <p className="mb-3 text-xs text-ink-500">{description}</p>
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="type" value={type} />
        {fields.map((f) => (
          <Field label={f.label} key={f.name}>
            <Textarea name={f.name} defaultValue={values[f.name] ?? ''} placeholder={f.placeholder} rows={2} disabled={!canEdit} />
          </Field>
        ))}
        {state?.error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
        {state?.success && <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">{t('saved')}</p>}
        {canEdit && <SubmitButton />}
      </form>
    </Card>
  );
}

export function TemplateManager({
  templates,
  canEdit,
}: {
  templates: Record<DocumentTemplateType, Record<string, string>>;
  canEdit: boolean;
}) {
  const t = useTranslations('documentTemplates');
  return (
    <div className="grid grid-cols-2 gap-4">
      <TemplateForm
        type="dropoff"
        title={t('dropoffTitle')}
        description={t('dropoffDescription')}
        fields={[
          { name: 'termsNote', label: t('dropoffTermsNote') },
          { name: 'footerNote', label: t('footerNote') },
        ]}
        values={templates.dropoff}
        canEdit={canEdit}
      />
      <TemplateForm
        type="completion"
        title={t('completionTitle')}
        description={t('completionDescription')}
        fields={[{ name: 'footerNote', label: t('footerNote') }]}
        values={templates.completion}
        canEdit={canEdit}
      />
      <TemplateForm
        type="receipt"
        title={t('receiptTitle')}
        description={t('receiptDescription')}
        fields={[{ name: 'footerNote', label: t('footerNote') }]}
        values={templates.receipt}
        canEdit={canEdit}
      />
      <TemplateForm
        type="invoice"
        title={t('invoiceTitle')}
        description={t('invoiceDescription')}
        fields={[{ name: 'footerNote', label: t('invoiceFooterNote') }]}
        values={templates.invoice}
        canEdit={canEdit}
      />
    </div>
  );
}
