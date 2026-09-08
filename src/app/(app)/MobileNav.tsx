'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LayoutDashboard, Wrench, ShoppingCart, Users, Settings } from 'lucide-react';
import { clsx } from 'clsx';

const ITEMS = [
  { href: '/dashboard', key: 'dashboard', icon: LayoutDashboard },
  { href: '/reparaties', key: 'repairs', icon: Wrench },
  { href: '/kassa', key: 'pos', icon: ShoppingCart },
  { href: '/klanten', key: 'customers', icon: Users },
  { href: '/instellingen', key: 'settings', icon: Settings },
] as const;

/**
 * Bottom tab bar for small viewports — the sidebar (Sidebar.tsx) is desktop-only (lg:flex).
 * `forceVisible` is set only inside the native app shell (AppShell.tsx), where the bottom tabs
 * are the permanent app navigation regardless of screen width — never set from the web layout.
 */
export function MobileNav({ forceVisible = false }: { forceVisible?: boolean }) {
  const pathname = usePathname();
  const t = useTranslations('nav');

  return (
    <nav
      className={clsx(
        'fixed inset-x-0 bottom-0 z-30 flex border-t border-ink-100 bg-white/95 backdrop-blur',
        !forceVisible && 'lg:hidden'
      )}
    >
      {ITEMS.map(({ href, key, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/');
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex flex-1 flex-col items-center gap-0.5 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] text-[11px] font-medium',
              active ? 'text-[var(--accent)]' : 'text-ink-500'
            )}
          >
            <Icon size={20} strokeWidth={active ? 2.25 : 2} />
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}
