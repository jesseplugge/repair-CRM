'use client';

import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { NotificationsBell } from '@/components/NotificationsBell';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import type { Notification } from '@/lib/actions/notifications';

export function TopBar({ notifications }: { notifications: Notification[] }) {
  const t = useTranslations('topbar');

  return (
    <div className="mb-6 flex items-center justify-end gap-2">
      <button
        onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
        className="flex items-center gap-2 rounded border border-ink-200 bg-white px-3 py-1.5 text-sm text-ink-500 hover:bg-ink-50"
      >
        <Search size={14} />
        {t('search')}
        <kbd className="ml-2 rounded border border-ink-200 bg-ink-50 px-1.5 py-0.5 text-[10px] text-ink-400">⌘K</kbd>
      </button>
      <LanguageSwitcher />
      <NotificationsBell notifications={notifications} />
    </div>
  );
}
