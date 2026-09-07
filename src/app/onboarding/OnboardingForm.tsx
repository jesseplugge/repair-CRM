'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';
import { createBusiness } from './actions';
import { Button, Card, Field, Input } from '@/components/ui/primitives';

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations('onboarding');
  const tAuth = useTranslations('auth');
  return (
    <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>
      {pending ? tAuth('busy') : t('createAndStart')}
    </Button>
  );
}

export function OnboardingForm({ defaultEmail }: { defaultEmail: string }) {
  const [state, formAction] = useFormState(createBusiness, { error: '' });
  const t = useTranslations('onboarding');

  return (
    <Card className="p-6">
      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('legalName')}>
            <Input name="legal_name" required placeholder="Jansen Telefoonreparatie B.V." />
          </Field>
          <Field label={t('tradingName')}>
            <Input name="trading_name" placeholder="Jansen GSM Service" />
          </Field>
        </div>
        <Field label={t('yourName')}>
          <Input name="full_name" required placeholder="Voor- en achternaam" />
        </Field>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Field label={t('address')}>
              <Input name="address" placeholder="Straatnaam 12" />
            </Field>
          </div>
          <Field label={t('postcode')}>
            <Input name="postcode" placeholder="1234 AB" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('city')}>
            <Input name="city" placeholder="Amsterdam" />
          </Field>
          <Field label={t('phone')}>
            <Input name="phone" placeholder="020 1234567" />
          </Field>
        </div>
        <Field label={t('emailForDocuments')}>
          <Input name="email" type="email" defaultValue={defaultEmail} />
        </Field>
        <div className="grid grid-cols-3 gap-4">
          <Field label={t('kvkNumber')}>
            <Input name="kvk_number" placeholder="12345678" />
          </Field>
          <Field label={t('vatNumber')}>
            <Input name="vat_number" placeholder="NL123456789B01" />
          </Field>
          <Field label={t('iban')}>
            <Input name="iban" placeholder="NL00 BANK 0000 0000 00" />
          </Field>
        </div>

        {state?.error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

        <SubmitButton />
      </form>
    </Card>
  );
}
