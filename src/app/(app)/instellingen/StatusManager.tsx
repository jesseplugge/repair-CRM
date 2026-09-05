'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useFormState, useFormStatus } from 'react-dom';
import { createStatus, updateStatus, toggleStatusActive, moveStatus } from '@/lib/actions/settings';
import { Button, Card, Field, Input } from '@/components/ui/primitives';
import { ArrowUp, ArrowDown, Plus } from 'lucide-react';

type Status = { id: string; name: string; color: string | null; is_terminal: boolean; active: boolean; sort_order: number };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? 'Bezig…' : 'Status toevoegen'}
    </Button>
  );
}

function StatusRow({ status, isFirst, isLast }: { status: Status; isFirst: boolean; isLast: boolean }) {
  const [name, setName] = useState(status.name);
  const [color, setColor] = useState(status.color ?? '#495164');
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function saveIfChanged() {
    if (name !== status.name || color !== status.color) {
      startTransition(async () => {
        await updateStatus(status.id, name, color);
        router.refresh();
      });
    }
  }

  return (
    <div className={`flex items-center gap-2 rounded border border-ink-100 px-3 py-2 ${!status.active ? 'opacity-50' : ''}`}>
      <div className="flex flex-col">
        <button disabled={isFirst} onClick={() => startTransition(async () => { await moveStatus(status.id, 'up'); router.refresh(); })} className="text-ink-300 hover:text-ink-700 disabled:opacity-30">
          <ArrowUp size={13} />
        </button>
        <button disabled={isLast} onClick={() => startTransition(async () => { await moveStatus(status.id, 'down'); router.refresh(); })} className="text-ink-300 hover:text-ink-700 disabled:opacity-30">
          <ArrowDown size={13} />
        </button>
      </div>
      <input type="color" value={color} onChange={(e) => setColor(e.target.value)} onBlur={saveIfChanged} className="h-7 w-7 shrink-0 cursor-pointer rounded border border-ink-200" />
      <Input value={name} onChange={(e) => setName(e.target.value)} onBlur={saveIfChanged} className="flex-1" disabled={pending} />
      {status.is_terminal && <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs text-ink-500">Eind</span>}
      <button
        onClick={() => startTransition(async () => { await toggleStatusActive(status.id, !status.active); router.refresh(); })}
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.active ? 'bg-green-100 text-green-700' : 'bg-ink-100 text-ink-500'}`}
      >
        {status.active ? 'Actief' : 'Inactief'}
      </button>
    </div>
  );
}

export function StatusManager({ statuses }: { statuses: Status[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createStatus, { error: '' });

  return (
    <div className="space-y-2">
      {statuses.map((s, i) => (
        <StatusRow key={s.id} status={s} isFirst={i === 0} isLast={i === statuses.length - 1} />
      ))}

      {open ? (
        <Card className="p-4">
          <form action={formAction} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Naam">
                <Input name="name" required placeholder="Wacht op verzending" />
              </Field>
              <Field label="Kleur">
                <input type="color" name="color" defaultValue="#0C7C82" className="h-9 w-full cursor-pointer rounded border border-ink-200" />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm text-ink-700">
              <input type="checkbox" name="is_terminal" /> Dit is een eindstatus (zoals Opgehaald / Geannuleerd)
            </label>
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
          <Plus size={15} /> Status toevoegen
        </button>
      )}
    </div>
  );
}
