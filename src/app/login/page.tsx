'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { authenticate } from './actions';
import { Button, Field, Input } from '@/components/ui/primitives';

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>
      {pending ? 'Bezig…' : label}
    </Button>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [state, formAction] = useFormState(authenticate, { error: '' });

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-2 font-display text-2xl font-semibold text-white">Reparatie CRM</div>
          <p className="text-sm text-ink-400">Beheer, kassa en administratie voor je reparatiezaak</p>
        </div>

        <div className="rounded-lg border border-ink-800 bg-white p-6 shadow-card">
          <div className="mb-5 flex rounded bg-ink-100 p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`flex-1 rounded py-1.5 transition-colors ${mode === 'signin' ? 'bg-white text-ink-900 shadow-card' : 'text-ink-600'}`}
            >
              Inloggen
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 rounded py-1.5 transition-colors ${mode === 'signup' ? 'bg-white text-ink-900 shadow-card' : 'text-ink-600'}`}
            >
              Account aanmaken
            </button>
          </div>

          <form action={formAction} className="space-y-4">
            <input type="hidden" name="mode" value={mode === 'signin' ? 'signin' : 'signup'} />
            <Field label="E-mailadres">
              <Input type="email" name="email" required autoComplete="email" placeholder="naam@bedrijf.nl" />
            </Field>
            <Field label="Wachtwoord">
              <Input
                type="password"
                name="password"
                required
                minLength={8}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </Field>

            {state?.error && (
              <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
            )}
            {state?.message && (
              <p className="rounded bg-[var(--accent-soft)] px-3 py-2 text-sm text-[var(--accent)]">{state.message}</p>
            )}

            <SubmitButton label={mode === 'signin' ? 'Inloggen' : 'Account aanmaken'} />
          </form>
        </div>
      </div>
    </div>
  );
}
