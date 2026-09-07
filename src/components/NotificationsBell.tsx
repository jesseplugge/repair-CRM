'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Bell } from 'lucide-react';
import { Popover } from '@/components/ui/popover';
import type { Notification } from '@/lib/actions/notifications';

export function NotificationsBell({ notifications }: { notifications: Notification[] }) {
  const t = useTranslations('notifications');

  return (
    <Popover
      width="w-80"
      trigger={({ ref, ...props }) => (
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          {...props}
          className="focus-ring relative flex h-8 w-8 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100"
        >
          <Bell size={17} />
          {notifications.length > 0 && (
            <span className="absolute right-0.5 top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
              {notifications.length}
            </span>
          )}
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="border-b border-ink-100 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
            {t('title')}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-ink-400">{t('empty')}</p>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.key}
                  href={n.href}
                  onClick={close}
                  className="flex items-start gap-2.5 border-b border-ink-50 px-4 py-2.5 text-sm text-ink-700 last:border-0 hover:bg-ink-50"
                >
                  <span>{n.icon}</span>
                  <span>{n.text}</span>
                </Link>
              ))
            )}
          </div>
        </>
      )}
    </Popover>
  );
}
