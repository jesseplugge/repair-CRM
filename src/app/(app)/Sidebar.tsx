'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Wrench,
  ShoppingCart,
  Users,
  Package,
  Boxes,
  FileText,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const NAV = [
  { href: '/dashboard', key: 'dashboard', icon: LayoutDashboard },
  { href: '/reparaties', key: 'repairs', icon: Wrench },
  { href: '/garantie', key: 'warranty', icon: ShieldCheck },
  { href: '/kassa', key: 'pos', icon: ShoppingCart },
  { href: '/klanten', key: 'customers', icon: Users },
  { href: '/producten', key: 'products', icon: Package },
  { href: '/voorraad', key: 'inventory', icon: Boxes },
  { href: '/facturen', key: 'invoices', icon: FileText },
  { href: '/bonnen', key: 'receipts', icon: Receipt },
  { href: '/rapportages', key: 'reports', icon: BarChart3 },
  { href: '/instellingen', key: 'settings', icon: Settings },
] as const;

export function Sidebar({ userName, logoUrl, businessName }: { userName: string; logoUrl: string | null; businessName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('nav');

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside
      className="flex w-60 shrink-0 flex-col text-ink-200"
      style={{ background: 'linear-gradient(180deg, #211D19 0%, #1C1917 100%)' }}
    >
      <div className="flex items-center gap-2.5 px-5 py-5">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={businessName} className="h-8 w-8 rounded object-contain bg-white/5" />
        ) : null}
        <span className="truncate font-display text-lg font-semibold text-white">{businessName}</span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {NAV.map(({ href, key, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex items-center gap-3 rounded px-3 py-2 text-sm font-medium transition-colors ${
                active ? 'bg-[var(--accent-soft)] text-[var(--accent-light)]' : 'text-ink-200 hover:bg-ink-900 hover:text-white'
              }`}
            >
              {active && (
                <span className="absolute -left-3 top-1.5 bottom-1.5 w-[3px] rounded-full bg-[var(--accent)]" />
              )}
              <Icon size={17} strokeWidth={2} />
              {t(key)}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-ink-900 px-3 py-4">
        <div className="mb-2 px-3 text-xs text-ink-400">{t('loggedInAs', { name: userName })}</div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded px-3 py-2 text-sm text-ink-200 hover:bg-ink-900 hover:text-white"
        >
          <LogOut size={17} />
          {t('logout')}
        </button>
      </div>
    </aside>
  );
}
