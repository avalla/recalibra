import { createInstance } from 'i18next';
import en from './locales/en.json';
import it from './locales/it.json';
import type { Language } from './language';

export const i18n = createInstance();
void i18n.init({
  resources: { en: { translation: en }, it: { translation: it } },
  lng: 'en', fallbackLng: 'en', supportedLngs: ['en', 'it'],
  initAsync: false, keySeparator: false, nsSeparator: false,
  returnEmptyString: false, interpolation: { escapeValue: false },
});

// Natural English keys keep the fallback readable; interpolation is explicit.
export function tr(key: string, values?: Record<string, unknown>): string {
  return String(i18n.t(key, { defaultValue: key, ...values }));
}
export const currentLanguage = (): Language => i18n.resolvedLanguage === 'it' ? 'it' : 'en';
export const localeTag = () => currentLanguage() === 'it' ? 'it-IT' : 'en-US';
export const formatNumber = (value: number, options?: Intl.NumberFormatOptions) => new Intl.NumberFormat(localeTag(), options).format(value);
export const formatDate = (value: Date | string, options?: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(localeTag(), options).format(new Date(value));
export const formatMinutes = (count: number) => tr('minutes', { count, formattedCount: formatNumber(count) });
