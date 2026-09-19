import { initializeLanguage } from '../i18n/runtime';
import { initDb } from '../db';

export async function initializeApp() {
  await initDb();
  await initializeLanguage();
}
