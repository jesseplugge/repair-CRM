'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { uploadLogo } from '@/lib/actions/settings';
import { Button } from '@/components/ui/primitives';
import { Upload } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" disabled={pending}>
      {pending ? 'Uploaden…' : 'Uploaden'}
    </Button>
  );
}

export function LogoUploader({ currentLogoUrl }: { currentLogoUrl: string | null }) {
  const [state, formAction] = useFormState(uploadLogo, { error: '' });
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <form action={formAction} className="flex items-center gap-4">
      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded border border-dashed border-ink-200 bg-ink-50">
        {preview || currentLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview ?? currentLogoUrl ?? ''} alt="Logo" className="h-full w-full object-contain" />
        ) : (
          <Upload size={18} className="text-ink-300" />
        )}
      </div>
      <div>
        <input
          type="file"
          name="logo"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setPreview(URL.createObjectURL(file));
          }}
          className="mb-1.5 block text-sm text-ink-600"
        />
        <div className="flex items-center gap-2">
          <SubmitButton />
          <span className="text-xs text-ink-400">PNG/JPG/SVG, max 2MB. Verschijnt op bonnen en facturen.</span>
        </div>
        {state?.error && <p className="mt-1 text-xs text-red-700">{state.error}</p>}
      </div>
    </form>
  );
}
