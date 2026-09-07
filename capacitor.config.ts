import type { CapacitorConfig } from '@capacitor/cli';

// This app uses Next.js server actions, cookies-based auth, and API routes —
// it can't be statically exported into `www/` and shipped inside the native
// binary the way a typical Capacitor app is. Instead the native shell loads
// the real deployed site directly, the same way a browser would. `www/` only
// exists to satisfy Capacitor's required webDir and is never actually used.
const config: CapacitorConfig = {
  appId: 'com.repaircrm.app',
  appName: 'Reparatie CRM',
  webDir: 'www',
  server: {
    url: 'https://repair-crm.vercel.app',
    cleartext: false,
  },
};

export default config;
