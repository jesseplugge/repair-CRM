import { createTranslator } from 'next-intl';
import { cookies } from 'next/headers';
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from '@/i18n/config';

export type PdfTranslator = (key: string, values?: Record<string, string | number>) => string;

export async function getPdfLocale(): Promise<Locale> {
  const cookieLocale = cookies().get(LOCALE_COOKIE)?.value;
  return isLocale(cookieLocale) ? cookieLocale : defaultLocale;
}

/**
 * PDF documents render via @react-pdf/renderer outside the React Server
 * Component tree, so they have no access to NextIntlClientProvider — build a
 * plain translator function from the same message catalogs instead.
 */
export async function getPdfTranslator(namespace: string): Promise<PdfTranslator> {
  const locale = await getPdfLocale();
  const messages = (await import(`@/messages/${locale}.json`)).default;
  return createTranslator({ locale, messages, namespace }) as PdfTranslator;
}
