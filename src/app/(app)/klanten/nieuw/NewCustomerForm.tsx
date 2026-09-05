'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { createCustomer, type CustomerSearchResult } from '@/lib/actions/customers';
import { Button, Card, Field, Input, Textarea } from '@/components/ui/primitives';
import { AlertTriangle } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" disabled={pending}>
      {pending ? 'Bezig…' : 'Klant opslaan'}
    </Button>
  );
}

export function NewCustomerForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction] = useFormState(createCustomer, {});
  const [phone, setPhone] = useState('');
  const [matches, setMatches] = useState<CustomerSearchResult[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(timer.current);
    if (phone.trim().length < 4) {
      setMatches([]);
      return;
    }
    timer.current = setTimeout(async () => {
      const res = await fetch(`/api/customers/search?q=${encodeURIComponent(phone)}`);
      setMatches(res.ok ? await res.json() : []);
    }, 300);
    return () => clearTimeout(timer.current);
  }, [phone]);

  return (
    <Card className="p-6">
      <form action={formAction} className="space-y-4">
        {redirectTo && <input type="hidden" name="redirect_to" value={redirectTo} />}

        <div className="grid grid-cols-2 gap-4">
          <Field label="Voornaam">
            <Input name="first_name" required />
          </Field>
          <Field label="Achternaam">
            <Input name="last_name" required />
          </Field>
        </div>

        <Field label="Bedrijfsnaam (optioneel)">
          <Input name="company_name" />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Telefoonnummer">
            <Input name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06 12345678" />
          </Field>
          <Field label="E-mail">
            <Input name="email" type="email" />
          </Field>
        </div>

        {matches.length > 0 && (
          <div className="flex items-start gap-2 rounded border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <div>
              Mogelijk bestaat deze klant al:{' '}
              {matches.slice(0, 3).map((m, i) => (
                <span key={m.id}>
                  {i > 0 && ', '}
                  <Link href={`/klanten/${m.id}`} className="underline">
                    {m.first_name} {m.last_name} ({m.phone ?? m.email})
                  </Link>
                </span>
              ))}
              . Controleer voordat je een nieuwe klant aanmaakt.
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Field label="Adres">
              <Input name="address" />
            </Field>
          </div>
          <Field label="Postcode">
            <Input name="postcode" />
          </Field>
        </div>
        <Field label="Plaats">
          <Input name="city" />
        </Field>
        <Field label="Opmerkingen">
          <Textarea name="notes" rows={3} />
        </Field>

        {state?.error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

        <div className="flex gap-3 pt-2">
          <SubmitButton />
          <Link href="/klanten">
            <Button type="button" variant="ghost">
              Annuleren
            </Button>
          </Link>
        </div>
      </form>
    </Card>
  );
}
