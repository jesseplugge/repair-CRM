'use client';

import { useEffect } from 'react';
import { isNativeApp } from '@/lib/native';

/**
 * Disables pinch- and double-tap-to-zoom inside the native iOS/Android app —
 * mounted at the root layout so it applies on every route, including
 * /login and /onboarding (outside AppShell, e.g. a fresh install or a
 * session that needs re-authenticating). A browser tab keeps normal zoom
 * for accessibility; only the wrapped native app gets this.
 */
export function NativeViewportFix() {
  useEffect(() => {
    if (!isNativeApp()) return;
    const meta = document.querySelector('meta[name="viewport"]');
    if (!meta) return;
    const content = meta.getAttribute('content') ?? '';
    if (!content.includes('maximum-scale')) {
      meta.setAttribute('content', `${content}, maximum-scale=1, user-scalable=no`);
    }
  }, []);
  return null;
}
