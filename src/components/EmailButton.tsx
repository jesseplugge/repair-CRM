'use client';

import { useState, useTransition } from 'react';
import { Mail, Check } from 'lucide-react';

type EmailAction = (id: string, overrideEmail?: string) => Promise<{ error?: string; success?: boolean }>;

export function EmailButton({ id, action, defaultEmail, label = 'E-mailen' }: { id: string; action: EmailAction; defaultEmail?: string | null; label?: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function send() {
    setError(null);
    const email = defaultEmail || window.prompt('E-mailadres:');
    if (!email) return;
    startTransition(async () => {
      const result = await action(id, email);
      if (result.error) setError(result.error);
      else setSent(true);
    });
  }

  return (
    <div>
      <button
        onClick={send}
        disabled={pending}
        className="flex w-full items-center gap-2 rounded border border-ink-200 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50 disabled:opacity-50"
      >
        {sent ? <Check size={15} className="text-green-600" /> : <Mail size={15} />}
        {pending ? 'Bezig…' : sent ? 'Verzonden' : label}
      </button>
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}
