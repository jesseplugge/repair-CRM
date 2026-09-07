'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Globe } from 'lucide-react';
import { setLocale } from '@/lib/actions/locale';
import { locales, localeLabels, type Locale } from '@/i18n/config';
import { Popover, DropdownMenuItem } from '@/components/ui/popover';

export function LanguageSwitcher() {
  const [pending, startTransition] = useTransition();
  const locale = useLocale();
  const t = useTranslations('topbar');
  const router = useRouter();

  function choose(l: Locale, close: () => void) {
    close();
    startTransition(async () => {
      await setLocale(l);
      router.refresh();
    });
  }

  return (
    <Popover
      width="w-40"
      trigger={({ ref, ...props }) => (
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          {...props}
          disabled={pending}
          title={t('language')}
          className="focus-ring flex h-8 w-8 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100 disabled:opacity-50"
        >
          <Globe size={16} />
        </button>
      )}
    >
      {(close) => (
        <div className="py-1">
          {locales.map((l) => (
            <DropdownMenuItem key={l} onClick={() => choose(l, close)} active={l === locale}>
              {localeLabels[l]}
            </DropdownMenuItem>
          ))}
        </div>
      )}
    </Popover>
  );
}
