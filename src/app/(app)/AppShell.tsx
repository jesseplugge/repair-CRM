'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { isNativeApp } from '@/lib/native';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { CommandPalette } from '@/components/CommandPalette';
import { NativeStatusBar } from './NativeStatusBar';

/**
 * Wraps the desktop sidebar / mobile bottom-nav split with one extra rule: inside the native
 * iOS/Android app, always use the bottom-tab layout and never the desktop sidebar, regardless of
 * screen width (an iPad-sized native window would otherwise land above the `lg` breakpoint and
 * render the same wide-screen sidebar as web, which is what actually prompted this component).
 *
 * Renders the plain web layout on first paint (matches server output — `isNativeApp()` needs
 * `window`, so it can't be known during SSR) and re-renders once after mount if native is
 * detected. That one extra frame is invisible in practice: the native splash screen is still
 * covering the view at that point.
 */
export function AppShell({
  children,
  sidebarProps,
  style,
}: {
  children: ReactNode;
  sidebarProps: { userName: string; logoUrl: string | null; businessName: string };
  style?: React.CSSProperties;
}) {
  const [native, setNative] = useState(false);

  useEffect(() => {
    if (isNativeApp()) {
      setNative(true);
      document.documentElement.dataset.shell = 'native';
    }
  }, []);

  return (
    <div className="flex min-h-screen" style={style}>
      {!native && <Sidebar {...sidebarProps} />}
      <main className={clsx('flex-1 bg-ink-50 p-4 pb-24', native ? 'sm:p-6' : 'sm:p-6 lg:p-8 lg:pb-8')}>{children}</main>
      <MobileNav forceVisible={native} />
      <CommandPalette />
      <NativeStatusBar />
    </div>
  );
}
