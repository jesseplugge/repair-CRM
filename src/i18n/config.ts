export const locales = ['nl', 'en', 'de', 'fr', 'es', 'tr'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'nl';

export const localeLabels: Record<Locale, string> = {
  nl: 'Nederlands',
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  tr: 'Türkçe',
};

export const LOCALE_COOKIE = 'NEXT_LOCALE';

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}
