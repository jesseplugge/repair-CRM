import type { Metadata, Viewport } from 'next';
import { Hanken_Grotesk, JetBrains_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { ToastProvider } from '@/components/ui/toast';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import './globals.css';

const hankenGrotesk = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-hanken' });
// Claim/repair numbers, days-in-shop counters and amounts set in tabular mono figures.
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['500', '700'], variable: '--font-mono' });

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
  themeColor: '#241C5B',
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
      <body className={`${hankenGrotesk.variable} ${jetbrainsMono.variable} font-sans`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ToastProvider>{children}</ToastProvider>
        </NextIntlClientProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
