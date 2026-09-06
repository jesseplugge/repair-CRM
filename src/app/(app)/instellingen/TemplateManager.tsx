'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { saveDocumentTemplate } from '@/lib/actions/templates';
import { Button, Card, Field, Textarea } from '@/components/ui/primitives';
import type { DocumentTemplateType } from '@/lib/pdf/templates';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? 'Opslaan…' : 'Opslaan'}
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
        {state?.success && <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">Opgeslagen.</p>}
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
  return (
    <div className="grid grid-cols-2 gap-4">
      <TemplateForm
        type="dropoff"
        title="Innamebewijs"
        description="Getoond op het intakebewijs bij het afgeven van een toestel."
        fields={[
          { name: 'termsNote', label: 'Opmerking bij geschatte prijs' },
          { name: 'footerNote', label: 'Voettekst (leeg = standaard bedankttekst)' },
        ]}
        values={templates.dropoff}
        canEdit={canEdit}
      />
      <TemplateForm
        type="completion"
        title="Afhaalbon (reparatie)"
        description="Getoond op de kassabon bij het ophalen van een gerepareerd toestel."
        fields={[{ name: 'footerNote', label: 'Voettekst (leeg = standaard bedankttekst)' }]}
        values={templates.completion}
        canEdit={canEdit}
      />
      <TemplateForm
        type="receipt"
        title="Kassabon (verkoop)"
        description="Getoond op de bon van een productverkoop via de kassa."
        fields={[{ name: 'footerNote', label: 'Voettekst (leeg = standaard bedankttekst)' }]}
        values={templates.receipt}
        canEdit={canEdit}
      />
      <TemplateForm
        type="invoice"
        title="Factuur"
        description="Extra regel onderaan elke factuur, na de betaalinstructie."
        fields={[{ name: 'footerNote', label: 'Extra voettekst (optioneel)' }]}
        values={templates.invoice}
        canEdit={canEdit}
      />
    </div>
  );
}
