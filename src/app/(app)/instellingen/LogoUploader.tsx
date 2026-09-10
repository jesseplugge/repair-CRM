'use client';

import { useId, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';
import { uploadLogo } from '@/lib/actions/settings';
import { Button } from '@/components/ui/primitives';
import { Upload } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations('logoUploader');
  return (
    <Button type="submit" variant="secondary" disabled={pending}>
      {pending ? t('uploading') : t('upload')}
    </Button>
  );
}

export function LogoUploader({ currentLogoUrl }: { currentLogoUrl: string | null }) {
  const [state, formAction] = useFormState(uploadLogo, { error: '' });
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputId = useId();
  const t = useTranslations('logoUploader');

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded border border-dashed border-ink-200 bg-ink-50">
        {preview || currentLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview ?? currentLogoUrl ?? ''} alt="Logo" className="h-full w-full object-contain" />
        ) : (
          <Upload size={18} className="text-ink-300" />
        )}
      </div>
      <div className="min-w-0">
        {/* A raw <input type="file"> renders its native "Choose File" chrome
            at an intrinsic width that ignores CSS width/max-width in many
            WebKit versions — hide it and trigger it from a normal styled
            label instead, which sidesteps the browser chrome entirely. */}
        <input
          id={inputId}
          type="file"
          name="logo"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setPreview(URL.createObjectURL(file));
              setFileName(file.name);
            }
          }}
          className="sr-only"
        />
        <label
          htmlFor={inputId}
          className="focus-ring mb-1.5 inline-block max-w-full cursor-pointer truncate rounded border border-ink-200 bg-white px-3 py-1.5 text-sm text-ink-700 hover:bg-ink-50"
        >
          {fileName ?? t('chooseFile')}
        </label>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <SubmitButton />
          <span className="text-xs text-ink-400">{t('hint')}</span>
        </div>
        {state?.error && <p className="mt-1 text-xs text-red-700">{state.error}</p>}
      </div>
    </form>
  );
}
