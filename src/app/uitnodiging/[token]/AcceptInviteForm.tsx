'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { signUpAndAccept, acceptAsExistingSession } from '@/lib/actions/accept-invite';
import { Button, Field, Input } from '@/components/ui/primitives';

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>
      {pending ? 'Bezig…' : label}
    </Button>
  );
}

export function SignupAcceptForm({ token, email }: { token: string; email: string }) {
  const [state, formAction] = useFormState(signUpAndAccept, { error: '' });

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="email" value={email} />
      <Field label="E-mailadres">
        <Input value={email} disabled />
      </Field>
      <Field label="Je naam">
        <Input name="full_name" required autoComplete="name" />
      </Field>
      <Field label="Wachtwoord">
        <Input type="password" name="password" required minLength={8} autoComplete="new-password" />
      </Field>
      {state?.error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state?.message && (
        <p className="rounded bg-[var(--accent-soft)] px-3 py-2 text-sm text-[var(--accent)]">{state.message}</p>
      )}
      <SubmitButton label="Aansluiten" />
    </form>
  );
}

export function JoinExistingSessionForm({ token }: { token: string }) {
  const [state, formAction] = useFormState(acceptAsExistingSession, { error: '' });

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <Field label="Je naam">
        <Input name="full_name" required autoComplete="name" />
      </Field>
      {state?.error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <SubmitButton label="Aansluiten bij bedrijf" />
    </form>
  );
}
