'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignatureCapture } from '@/components/SignatureCapture';
import { Button } from '@/components/ui/primitives';
import { PenLine, X } from 'lucide-react';

export function SignatureModalTrigger({
  repairId,
  activeTerms,
}: {
  repairId: string;
  activeTerms: { content: string; versionLabel: string } | null;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  if (!activeTerms) {
    return (
      <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
        Geen actieve Algemene Voorwaarden — voeg er een toe in Instellingen om te kunnen ondertekenen.
      </div>
    );
  }

  return (
    <>
      <Button type="button" variant="primary" className="w-full" onClick={() => setOpen(true)}>
        <PenLine size={15} /> Klant laten ondertekenen
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 p-4" onClick={() => setOpen(false)}>
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-ink-50 p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink-950">Ondertekenen</h2>
              <button onClick={() => setOpen(false)} className="text-ink-400 hover:text-ink-700">
                <X size={18} />
              </button>
            </div>
            <SignatureCapture
              repairId={repairId}
              termsContent={activeTerms.content}
              termsVersionLabel={activeTerms.versionLabel}
              onSuccess={() => {
                setOpen(false);
                router.refresh();
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
