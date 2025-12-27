import { initDb } from '../db';
import { initializeRevenueCat } from '../lib/revenuecat';

export async function initializeApp() {
  await initDb();
  await initializeRevenueCat();
}
