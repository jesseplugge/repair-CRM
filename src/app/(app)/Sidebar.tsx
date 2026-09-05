'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/reparaties', label: 'Reparaties', icon: Wrench },
  { href: '/kassa', label: 'Kassa', icon: ShoppingCart },
  { href: '/klanten', label: 'Klanten', icon: Users },
  { href: '/producten', label: 'Producten', icon: Package },
  { href: '/voorraad', label: 'Voorraad', icon: Boxes },
  { href: '/facturen', label: 'Facturen', icon: FileText },
  { href: '/bonnen', label: 'Bonnen', icon: Receipt },
  { href: '/rapportages', label: 'Rapportages', icon: BarChart3 },
  { href: '/instellingen', label: 'Instellingen', icon: Settings },
];

export function Sidebar({ userName, logoUrl, businessName }: { userName: string; logoUrl: string | null; businessName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col bg-ink-950 text-ink-200">
      <div className="flex items-center gap-2.5 px-5 py-5">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={businessName} className="h-8 w-8 rounded object-contain bg-white/5" />
        ) : null}
        <span className="truncate font-display text-lg font-semibold text-white">{businessName}</span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded px-3 py-2 text-sm font-medium transition-colors ${
                active ? 'bg-[var(--accent-soft)] text-[var(--accent-light)]' : 'text-ink-200 hover:bg-ink-900 hover:text-white'
              }`}
            >
              <Icon size={17} strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-ink-900 px-3 py-4">
        <div className="mb-2 px-3 text-xs text-ink-400">Ingelogd als {userName}</div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded px-3 py-2 text-sm text-ink-200 hover:bg-ink-900 hover:text-white"
        >
          <LogOut size={17} />
          Uitloggen
        </button>
      </div>
    </aside>
  );
}
