import type { SQLiteDatabase } from 'expo-sqlite';

// Existing ratings may be defaults or estimates. Preserve their values, but
// never retroactively label them as explicit user responses.
export async function ensureSessionStressColumns(db: Pick<SQLiteDatabase, 'getAllAsync' | 'execAsync'>): Promise<void> {
  const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(sessions)');
  for (const name of ['pre_stress_recorded', 'post_stress_recorded']) {
    if (!columns.some((column) => column.name === name)) {
      await db.execAsync(`ALTER TABLE sessions ADD COLUMN ${name} INTEGER NOT NULL DEFAULT 0;`);
    }
  }
}
