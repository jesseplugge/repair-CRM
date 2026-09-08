import { Capacitor } from '@capacitor/core';

/** True only inside the wrapped iOS/Android app (Capacitor), never in a browser — including mobile Safari/Chrome. */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}
