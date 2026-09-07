'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';
import { signUpAndAccept, acceptAsExistingSession } from '@/lib/actions/accept-invite';
import { Button, Field, Input } from '@/components/ui/primitives';

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  const t = useTranslations('acceptInvite');
  return (
    <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>
      {pending ? t('busy') : label}
    </Button>
  );
}

export function SignupAcceptForm({ token, email }: { token: string; email: string }) {
  const [state, formAction] = useFormState(signUpAndAccept, { error: '' });
  const t = useTranslations('acceptInvite');

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="email" value={email} />
      <Field label={t('emailLabel')}>
        <Input value={email} disabled />
      </Field>
      <Field label={t('nameLabel')}>
        <Input name="full_name" required autoComplete="name" />
      </Field>
      <Field label={t('passwordLabel')}>
        <Input type="password" name="password" required minLength={8} autoComplete="new-password" />
      </Field>
      {state?.error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state?.message && (
        <p className="rounded bg-[var(--accent-soft)] px-3 py-2 text-sm text-[var(--accent)]">{state.message}</p>
      )}
      <SubmitButton label={t('join')} />
    </form>
  );
}

export function JoinExistingSessionForm({ token }: { token: string }) {
  const [state, formAction] = useFormState(acceptAsExistingSession, { error: '' });
  const t = useTranslations('acceptInvite');

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <Field label={t('nameLabel')}>
        <Input name="full_name" required autoComplete="name" />
      </Field>
      {state?.error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <SubmitButton label={t('joinCompany')} />
    </form>
  );
}
