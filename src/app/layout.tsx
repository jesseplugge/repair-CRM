import type { Metadata, Viewport } from 'next';
import { Archivo } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { ToastProvider } from '@/components/ui/toast';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import './globals.css';

// Variable font with a width axis: normal width for body, expanded for display.
const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-archivo' });

export const metadata: Metadata = {
  title: 'Reparatie CRM',
  description: 'CRM, reparatiebeheer en kassa voor telefoonreparatie',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/favicon.ico' }, { url: '/favicon.png', type: 'image/png' }],
    apple: [{ url: '/apple-touch-icon.png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Reparatie CRM',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#22343B',
  // Lets the page reach the physical screen edges in standalone/native contexts so the
  // env(safe-area-inset-*) values used by MobileNav/AppShell actually resolve to real
  // insets instead of always computing to 0. No visible effect in an ordinary browser tab.
  viewportFit: 'cover',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${archivo.variable} font-sans`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ToastProvider>{children}</ToastProvider>
        </NextIntlClientProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
