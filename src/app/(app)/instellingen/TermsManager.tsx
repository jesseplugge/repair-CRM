'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createTermsVersion } from '@/lib/actions/settings';
import { Button, Card, Field, Input, Textarea } from '@/components/ui/primitives';
import { formatDate } from '@/lib/utils/format';
import { Plus } from 'lucide-react';

type TermsVersion = { id: string; version_label: string; effective_date: string; is_active: boolean; content: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? 'Bezig…' : 'Nieuwe versie opslaan'}
    </Button>
  );
}

export function TermsManager({ versions }: { versions: TermsVersion[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createTermsVersion, {});
  const active = versions.find((v) => v.is_active);
  const history = versions.filter((v) => !v.is_active);

  return (
    <div className="space-y-3">
      <Card className="p-4">
        {active ? (
          <>
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Actief</span>
              <span className="font-medium text-ink-900">
                Algemene Voorwaarden {active.version_label} — geldig vanaf {formatDate(active.effective_date)}
              </span>
            </div>
            <p className="max-h-32 overflow-y-auto whitespace-pre-wrap text-sm text-ink-600">{active.content}</p>
          </>
        ) : (
          <p className="text-sm text-ink-400">Geen actieve versie.</p>
        )}
      </Card>

      {history.length > 0 && (
        <div className="text-xs text-ink-400">
          Eerdere versies (blijven gekoppeld aan al ondertekende intakes):{' '}
          {history.map((v) => `${v.version_label} (t/m ${formatDate(v.effective_date)})`).join(', ')}
        </div>
      )}

      {open ? (
        <Card className="p-4">
          <form action={formAction} className="space-y-3">
            <input type="hidden" name="document_type" value="algemene_voorwaarden" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Versienummer">
                <Input name="version_label" required placeholder="v1.1" />
              </Field>
              <Field label="Geldig vanaf">
                <Input name="effective_date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
              </Field>
            </div>
            <Field label="Tekst">
              <Textarea name="content" rows={8} required />
            </Field>
            {state?.error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
            <div className="flex gap-2">
              <SubmitButton />
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Annuleren
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline">
          <Plus size={15} /> Nieuwe versie toevoegen
        </button>
      )}
    </div>
  );
}
