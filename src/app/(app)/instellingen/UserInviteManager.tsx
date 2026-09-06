'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useFormState, useFormStatus } from 'react-dom';
import { createInvite, revokeInvite } from '@/lib/actions/invites';
import { Button, Card, Field, Input } from '@/components/ui/primitives';
import { Plus, X } from 'lucide-react';
import { formatDate } from '@/lib/utils/format';

type Member = { id: string; full_name: string; email: string; role: string };
type Invite = { id: string; email: string; role: string; expires_at: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? 'Bezig…' : 'Uitnodiging versturen'}
    </Button>
  );
}

export function UserInviteManager({
  members,
  invites,
  canInvite,
}: {
  members: Member[];
  invites: Invite[];
  canInvite: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createInvite, { error: '' });
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-ink-100 bg-white shadow-card">
        {members.map((u) => (
          <div
            key={u.id}
            className="flex items-center justify-between border-b border-ink-100 px-4 py-3 text-sm last:border-0"
          >
            <div>
              <div className="font-medium text-ink-900">{u.full_name}</div>
              <div className="text-ink-400">{u.email}</div>
            </div>
            <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-600">
              {u.role === 'owner' ? 'Eigenaar' : 'Medewerker'}
            </span>
          </div>
        ))}
      </div>

      {invites.length > 0 && (
        <div className="rounded-lg border border-ink-100 bg-white shadow-card">
          {invites.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between gap-3 border-b border-ink-100 px-4 py-3 text-sm last:border-0"
            >
              <div>
                <div className="font-medium text-ink-900">{inv.email}</div>
                <div className="text-ink-400">
                  {inv.role === 'owner' ? 'Eigenaar' : 'Medewerker'} · uitnodiging · verloopt {formatDate(inv.expires_at)}
                </div>
              </div>
              {canInvite && (
                <button
                  onClick={() =>
                    startTransition(async () => {
                      await revokeInvite(inv.id);
                      router.refresh();
                    })
                  }
                  disabled={pending}
                  className="flex shrink-0 items-center gap-1 text-xs font-medium text-ink-400 hover:text-red-600"
                >
                  <X size={13} /> Intrekken
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {canInvite &&
        (open ? (
          <Card className="p-4">
            <form action={formAction} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="E-mailadres">
                  <Input type="email" name="email" required placeholder="collega@bedrijf.nl" />
                </Field>
                <Field label="Rol">
                  <select
                    name="role"
                    defaultValue="employee"
                    className="h-9 w-full rounded border border-ink-200 bg-white px-2 text-sm"
                  >
                    <option value="employee">Medewerker</option>
                    <option value="owner">Eigenaar</option>
                  </select>
                </Field>
              </div>
              {state?.error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
              {state?.inviteUrl && (
                <div className="rounded bg-[var(--accent-soft)] px-3 py-2 text-sm text-[var(--accent)]">
                  {state.emailSent
                    ? 'Uitnodiging verstuurd. '
                    : 'E-mail is niet geconfigureerd — deel deze link handmatig: '}
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(state.inviteUrl!)}
                    className="font-medium underline"
                  >
                    Link kopiëren
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <SubmitButton />
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Sluiten
                </Button>
              </div>
            </form>
          </Card>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline"
          >
            <Plus size={15} /> Teamlid uitnodigen
          </button>
        ))}

      {!canInvite && (
        <p className="text-xs text-ink-400">Alleen eigenaren kunnen teamleden uitnodigen.</p>
      )}
    </div>
  );
}
