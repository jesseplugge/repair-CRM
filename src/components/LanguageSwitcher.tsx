'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Globe } from 'lucide-react';
import { setLocale } from '@/lib/actions/locale';
import { locales, localeLabels, type Locale } from '@/i18n/config';

export function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const locale = useLocale();
  const t = useTranslations('topbar');
  const router = useRouter();

  function choose(l: Locale) {
    setOpen(false);
    startTransition(async () => {
      await setLocale(l);
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        title={t('language')}
        className="flex h-8 w-8 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100 disabled:opacity-50"
      >
        <Globe size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-40 rounded-lg border border-ink-200 bg-white py-1 shadow-xl">
            {locales.map((l) => (
              <button
                key={l}
                onClick={() => choose(l)}
                className={`flex w-full items-center px-3 py-1.5 text-left text-sm hover:bg-ink-50 ${
                  l === locale ? 'font-semibold text-[var(--accent)]' : 'text-ink-700'
                }`}
              >
                {localeLabels[l]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
