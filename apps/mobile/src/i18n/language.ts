export type Language = 'en' | 'it';
export type LanguagePreference = Language | 'system';
export const isLanguagePreference = (value: unknown): value is LanguagePreference =>
  value === 'system' || value === 'en' || value === 'it';
export function resolveLanguage(preference: LanguagePreference, systemTag?: string | null): Language {
  if (preference !== 'system') return preference;
  return systemTag?.toLowerCase().split(/[-_]/)[0] === 'it' ? 'it' : 'en';
}
