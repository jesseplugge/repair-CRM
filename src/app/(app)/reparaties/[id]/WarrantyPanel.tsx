'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useFormState, useFormStatus } from 'react-dom';
import { createWarrantyClaim, updateWarrantyClaimStatus } from '@/lib/actions/warranty';
import { Button, Field, Textarea } from '@/components/ui/primitives';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate } from '@/lib/utils/format';
import { Plus } from 'lucide-react';

export type WarrantyClaim = {
  id: string;
  claim_number: string;
  description: string;
  status: string;
  resolution: string | null;
  created_at: string;
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  new: { label: 'Nieuw', color: '#4C5FD5' },
  investigating: { label: 'Onderzoek', color: '#C97A22' },
  approved: { label: 'Goedgekeurd', color: '#0C7C82' },
  rejected: { label: 'Afgewezen', color: '#C4453A' },
  repairing: { label: 'In reparatie', color: '#C97A22' },
  resolved: { label: 'Afgehandeld', color: '#2F8F5B' },
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? 'Bezig…' : 'Claim aanmaken'}
    </Button>
  );
}

function ClaimRow({ claim }: { claim: WarrantyClaim }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const meta = STATUS_META[claim.status] ?? { label: claim.status, color: '#495164' };

  return (
    <div className="rounded border border-ink-100 p-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium text-ink-900">{claim.claim_number}</span>
        <StatusBadge name={meta.label} color={meta.color} />
      </div>
      <p className="mt-1 text-ink-600">{claim.description}</p>
      {claim.resolution && <p className="mt-1 text-xs italic text-ink-500">Afhandeling: {claim.resolution}</p>}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-ink-400">{formatDate(claim.created_at)}</span>
        <select
          value={claim.status}
          disabled={pending}
          onChange={(e) =>
            startTransition(async () => {
              await updateWarrantyClaimStatus(claim.id, e.target.value);
              router.refresh();
            })
          }
          className="rounded border border-ink-200 bg-white px-2 py-1 text-xs"
        >
          {Object.entries(STATUS_META).map(([value, m]) => (
            <option key={value} value={value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function WarrantyPanel({ repairId, claims }: { repairId: string; claims: WarrantyClaim[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createWarrantyClaim, { error: '' });

  return (
    <div className="space-y-3">
      {claims.map((c) => (
        <ClaimRow key={c.id} claim={c} />
      ))}
      {claims.length === 0 && !open && <p className="text-sm text-ink-400">Nog geen garantieclaims.</p>}

      {open ? (
        <form action={formAction} className="space-y-2 rounded border border-ink-100 p-3">
          <input type="hidden" name="repair_id" value={repairId} />
          <Field label="Klacht">
            <Textarea name="description" required rows={2} placeholder="Wat is er mis na de reparatie?" />
          </Field>
          {state?.error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
          <div className="flex gap-2">
            <SubmitButton />
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuleren
            </Button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline"
        >
          <Plus size={15} /> Garantieclaim aanmaken
        </button>
      )}
    </div>
  );
}
