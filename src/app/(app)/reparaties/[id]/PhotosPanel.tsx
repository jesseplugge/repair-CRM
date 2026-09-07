'use client';

import { useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { uploadRepairPhoto, deleteRepairPhoto, PHOTO_LABELS } from '@/lib/actions/photos';
import { Button } from '@/components/ui/primitives';
import { Trash2, Upload } from 'lucide-react';

const LABEL_NL: Record<string, string> = {
  front: 'Voorkant',
  back: 'Achterkant',
  left: 'Links',
  right: 'Rechts',
  top: 'Boven',
  bottom: 'Onder',
  damage: 'Schade',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" disabled={pending}>
      {pending ? 'Uploaden…' : 'Uploaden'}
    </Button>
  );
}

export function PhotosPanel({
  repairId,
  photos,
}: {
  repairId: string;
  photos: { id: string; url: string; label: string | null }[];
}) {
  const [state, formAction] = useFormState(uploadRepairPhoto, { error: '' });
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleDelete(id: string) {
    await deleteRepairPhoto(id, repairId);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form
        action={(fd) => {
          formAction(fd);
          setPreview(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
        className="flex flex-wrap items-end gap-2"
      >
        <input type="hidden" name="repair_id" value={repairId} />
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-600">Foto</label>
          <input
            ref={fileInputRef}
            type="file"
            name="photo"
            accept="image/*"
            capture="environment"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setPreview(file ? URL.createObjectURL(file) : null);
            }}
            className="block text-sm text-ink-600"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-600">Label</label>
          <select name="label" className="rounded border border-ink-200 bg-white px-2 py-1.5 text-sm">
            <option value="">Geen</option>
            {PHOTO_LABELS.map((l) => (
              <option key={l} value={l}>
                {LABEL_NL[l]}
              </option>
            ))}
          </select>
        </div>
        <SubmitButton />
        {preview && <img src={preview} alt="Voorbeeld" className="h-12 w-12 rounded object-cover" />}
      </form>
      {state?.error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

      {photos.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-ink-400">
          <Upload size={15} /> Nog geen foto&apos;s toegevoegd.
        </p>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {photos.map((p) => (
            <div key={p.id} className="group relative overflow-hidden rounded-lg border border-ink-100">
              <img src={p.url} alt={p.label ?? 'Foto'} className="aspect-square w-full object-cover" />
              {p.label && (
                <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                  {LABEL_NL[p.label] ?? p.label}
                </span>
              )}
              <button
                onClick={() => handleDelete(p.id)}
                className="absolute right-1 top-1 rounded bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                title="Verwijderen"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
