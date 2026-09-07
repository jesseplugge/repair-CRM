import { getTranslations } from 'next-intl/server';
import { NewCustomerForm } from './NewCustomerForm';

export default async function NieuweKlantPage({ searchParams }: { searchParams: { redirect_to?: string } }) {
  const t = await getTranslations('newCustomer');
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-950">{t('pageTitle')}</h1>
        <p className="text-sm text-ink-600">{t('pageSubtitle')}</p>
      </div>
      <NewCustomerForm redirectTo={searchParams.redirect_to} />
    </div>
  );
}
