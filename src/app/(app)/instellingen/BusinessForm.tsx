'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';
import { updateBusiness } from '@/lib/actions/settings';
import { Button, Card, Field, Input } from '@/components/ui/primitives';

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations('businessForm');
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? t('busy') : t('save')}
    </Button>
  );
}

export function BusinessForm({ business }: { business: any }) {
  const [state, formAction] = useFormState(updateBusiness, { error: '' });
  const t = useTranslations('businessForm');

  return (
    <Card className="p-5">
      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('legalName')}>
            <Input name="legal_name" defaultValue={business.legal_name} required />
          </Field>
          <Field label={t('tradingName')}>
            <Input name="trading_name" defaultValue={business.trading_name ?? ''} />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Field label={t('address')}>
              <Input name="address" defaultValue={business.address ?? ''} />
            </Field>
          </div>
          <Field label={t('postcode')}>
            <Input name="postcode" defaultValue={business.postcode ?? ''} />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label={t('city')}>
            <Input name="city" defaultValue={business.city ?? ''} />
          </Field>
          <Field label={t('phone')}>
            <Input name="phone" defaultValue={business.phone ?? ''} />
          </Field>
          <Field label={t('email')}>
            <Input name="email" type="email" defaultValue={business.email ?? ''} />
          </Field>
        </div>
        <Field label={t('website')}>
          <Input name="website" defaultValue={business.website ?? ''} />
        </Field>
        <div className="grid grid-cols-3 gap-4">
          <Field label={t('kvkNumber')}>
            <Input name="kvk_number" defaultValue={business.kvk_number ?? ''} />
          </Field>
          <Field label={t('vatNumber')}>
            <Input name="vat_number" defaultValue={business.vat_number ?? ''} />
          </Field>
          <Field label={t('iban')}>
            <Input name="iban" defaultValue={business.iban ?? ''} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('defaultVatRate')}>
            <Input name="default_vat_rate" type="number" step="0.01" defaultValue={business.default_vat_rate} />
          </Field>
          <Field label={t('defaultWarranty')}>
            <Input name="default_warranty_months" type="number" defaultValue={business.default_warranty_months} />
          </Field>
        </div>

        {state?.error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
        {state?.success && <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">{t('saved')}</p>}

        <SubmitButton />
      </form>
    </Card>
  );
}
