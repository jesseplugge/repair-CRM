'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { isNativeApp } from '@/lib/native';

/** Matches the OS status bar to the app's light background instead of the WebView default. Native only. */
export function NativeStatusBar() {
  useEffect(() => {
    if (!isNativeApp()) return;
    import('@capacitor/status-bar').then(({ StatusBar, Style }) => {
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      if (Capacitor.getPlatform() === 'android') {
        StatusBar.setBackgroundColor({ color: '#FAF7F1' }).catch(() => {});
      }
    });
  }, []);
  return null;
}
