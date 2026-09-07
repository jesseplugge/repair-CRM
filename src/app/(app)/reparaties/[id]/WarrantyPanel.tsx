'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useFormState, useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';
import { createWarrantyClaim, updateWarrantyClaimStatus } from '@/lib/actions/warranty';
import { Button, Field, Textarea } from '@/components/ui/primitives';
import { StatusBadge } from '@/components/StatusBadge';
import { useToast } from '@/components/ui/toast';
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

const STATUS_KEYS: Record<string, string> = {
  new: 'statusNew',
  investigating: 'statusInvestigating',
  approved: 'statusApproved',
  rejected: 'statusRejected',
  repairing: 'statusRepairing',
  resolved: 'statusResolved',
};
const STATUS_COLORS: Record<string, string> = {
  new: '#4C5FD5',
  investigating: '#C97A22',
  approved: '#0C7C82',
  rejected: '#C4453A',
  repairing: '#C97A22',
  resolved: '#2F8F5B',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations('repairTabs');
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? t('busy') : t('createClaim')}
    </Button>
  );
}

function ClaimRow({ claim }: { claim: WarrantyClaim }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations('repairTabs');
  const label = STATUS_KEYS[claim.status] ? t(STATUS_KEYS[claim.status] as any) : claim.status;
  const color = STATUS_COLORS[claim.status] ?? '#495164';

  return (
    <div className="rounded border border-ink-100 p-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium text-ink-900">{claim.claim_number}</span>
        <StatusBadge name={label} color={color} />
      </div>
      <p className="mt-1 text-ink-600">{claim.description}</p>
      {claim.resolution && <p className="mt-1 text-xs italic text-ink-500">{t('resolutionLabel', { resolution: claim.resolution })}</p>}
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
          {Object.entries(STATUS_KEYS).map(([value, key]) => (
            <option key={value} value={value}>
              {t(key as any)}
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
  const t = useTranslations('repairTabs');
  const toast = useToast();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!state?.error) {
      toast({ variant: 'success', title: t('claimCreated') });
      setOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="space-y-3">
      {claims.map((c) => (
        <ClaimRow key={c.id} claim={c} />
      ))}
      {claims.length === 0 && !open && <p className="text-sm text-ink-400">{t('noClaimsYet')}</p>}

      {open ? (
        <form action={formAction} className="space-y-2 rounded border border-ink-100 p-3">
          <input type="hidden" name="repair_id" value={repairId} />
          <Field label={t('claimComplaint')}>
            <Textarea name="description" required rows={2} placeholder={t('claimDescriptionPlaceholder')} />
          </Field>
          {state?.error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
          <div className="flex gap-2">
            <SubmitButton />
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {t('cancel')}
            </Button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline"
        >
          <Plus size={15} /> {t('createClaim')}
        </button>
      )}
    </div>
  );
}
