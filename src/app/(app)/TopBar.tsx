'use client';

import Link from 'next/link';
import { Search, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { NotificationsBell } from '@/components/NotificationsBell';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/primitives';
import type { Notification } from '@/lib/actions/notifications';

export function TopBar({ notifications }: { notifications: Notification[] }) {
  const t = useTranslations('topbar');

  return (
    <div className="mb-6 flex items-center justify-end gap-2">
      <Link href="/reparaties/nieuw" className="mr-auto">
        <Button variant="primary">
          <Plus size={16} /> <span className="hidden sm:inline">{t('newRepair')}</span>
        </Button>
      </Link>
      <button
        onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
        className="focus-ring flex items-center gap-2 rounded border border-ink-200 bg-white px-3 py-1.5 text-sm text-ink-500 hover:bg-ink-50"
      >
        <Search size={14} />
        <span className="hidden sm:inline">{t('search')}</span>
        <kbd className="ml-2 hidden rounded border border-ink-200 bg-ink-50 px-1.5 py-0.5 text-[10px] text-ink-400 md:inline">⌘K</kbd>
      </button>
      <LanguageSwitcher />
      <NotificationsBell notifications={notifications} />
    </div>
  );
}
