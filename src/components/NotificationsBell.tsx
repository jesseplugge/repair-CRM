'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import type { Notification } from '@/lib/actions/notifications';

export function NotificationsBell({ notifications }: { notifications: Notification[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-8 w-8 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100"
      >
        <Bell size={17} />
        {notifications.length > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
            {notifications.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-ink-200 bg-white shadow-xl">
            <div className="border-b border-ink-100 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
              Meldingen
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-ink-400">Geen meldingen.</p>
              ) : (
                notifications.map((n) => (
                  <Link
                    key={n.key}
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-2.5 border-b border-ink-50 px-4 py-2.5 text-sm text-ink-700 last:border-0 hover:bg-ink-50"
                  >
                    <span>{n.icon}</span>
                    <span>{n.text}</span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
