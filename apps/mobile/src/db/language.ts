import { getDb } from './db';
import { isLanguagePreference, type LanguagePreference } from '../i18n/language';

export async function getLanguagePreference(): Promise<LanguagePreference> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>("SELECT value FROM app_settings WHERE key = 'language'");
  return isLanguagePreference(row?.value) ? row.value : 'system';
}
export async function saveLanguagePreference(value: LanguagePreference): Promise<void> {
  if (!isLanguagePreference(value)) throw new Error('Unsupported language preference');
  const db = await getDb();
  await db.runAsync("INSERT INTO app_settings (key, value) VALUES ('language', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", [value]);
}
