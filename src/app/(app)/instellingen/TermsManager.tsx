'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';
import { createTermsVersion } from '@/lib/actions/settings';
import { Button, Card, Field, Input, Textarea } from '@/components/ui/primitives';
import { formatDate } from '@/lib/utils/format';
import { Plus } from 'lucide-react';

type TermsVersion = { id: string; version_label: string; effective_date: string; is_active: boolean; content: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations('termsManager');
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? t('busy') : t('saveNewVersion')}
    </Button>
  );
}

export function TermsManager({ versions }: { versions: TermsVersion[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createTermsVersion, { error: '' });
  const active = versions.find((v) => v.is_active);
  const history = versions.filter((v) => !v.is_active);
  const t = useTranslations('termsManager');

  return (
    <div className="space-y-3">
      <Card className="p-4">
        {active ? (
          <>
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">{t('active')}</span>
              <span className="font-medium text-ink-900">
                {t('activeVersion', { version: active.version_label, date: formatDate(active.effective_date) })}
              </span>
            </div>
            <p className="max-h-32 overflow-y-auto whitespace-pre-wrap text-sm text-ink-600">{active.content}</p>
          </>
        ) : (
          <p className="text-sm text-ink-400">{t('noActiveVersion')}</p>
        )}
      </Card>

      {history.length > 0 && (
        <div className="text-xs text-ink-400">
          {t('previousVersions', {
            list: history.map((v) => `${v.version_label} (${t('throughDate', { date: formatDate(v.effective_date) })})`).join(', '),
          })}
        </div>
      )}

      {open ? (
        <Card className="p-4">
          <form action={formAction} className="space-y-3">
            <input type="hidden" name="document_type" value="algemene_voorwaarden" />
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('versionNumber')}>
                <Input name="version_label" required placeholder="v1.1" />
              </Field>
              <Field label={t('effectiveFrom')}>
                <Input name="effective_date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
              </Field>
            </div>
            <Field label={t('text')}>
              <Textarea name="content" rows={8} required />
            </Field>
            {state?.error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
            <div className="flex gap-2">
              <SubmitButton />
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                {t('cancel')}
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline">
          <Plus size={15} /> {t('addNewVersion')}
        </button>
      )}
    </div>
  );
}
