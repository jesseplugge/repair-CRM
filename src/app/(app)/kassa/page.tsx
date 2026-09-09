import { getTranslations } from 'next-intl/server';
import { PosTerminal } from './PosTerminal';
import Link from 'next/link';

export default async function KassaPage() {
  const t = await getTranslations('posPage');
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-950">{t('title')}</h1>
          <p className="text-sm text-ink-600">{t('subtitle')}</p>
        </div>
        <Link
          href="/kassa/kassalade"
          className="self-start rounded border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
        >
          {t('cashDrawer')}
        </Link>
      </div>
      <PosTerminal />
    </div>
  );
}
