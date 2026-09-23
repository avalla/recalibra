import type { SQLiteDatabase } from 'expo-sqlite';

type SessionColumn = {
  name: string;
  notnull: number;
};

const SESSION_COLUMNS = [
  'id',
  'user_id',
  'exercise_id',
  'started_at',
  'completed_at',
  'duration_seconds',
  'pre_stress_level',
  'post_stress_level',
  'pre_stress_recorded',
  'post_stress_recorded',
  'notes',
  'created_at',
  'journey_id',
  'journey_step_id',
] as const;

// Existing ratings may be defaults or estimates. Preserve their values, but
// never retroactively label them as explicit user responses.
export async function ensureSessionStressColumns(db: Pick<SQLiteDatabase, 'getAllAsync' | 'execAsync'>): Promise<void> {
  let columns = await db.getAllAsync<SessionColumn>('PRAGMA table_info(sessions)');
  for (const name of ['pre_stress_recorded', 'post_stress_recorded']) {
    if (!columns.some((column) => column.name === name)) {
      await db.execAsync(`ALTER TABLE sessions ADD COLUMN ${name} INTEGER NOT NULL DEFAULT 0;`);
    }
  }

  columns = await db.getAllAsync<SessionColumn>('PRAGMA table_info(sessions)');
  const preStressColumn = columns.find((column) => column.name === 'pre_stress_level');
  if (preStressColumn?.notnull !== 1) return;

  const sourceColumns = new Set(columns.map((column) => column.name));
  const copyColumns = SESSION_COLUMNS.filter((name) => sourceColumns.has(name));
  const sourceValues = copyColumns.map((name) => name).join(', ');

  await db.execAsync('PRAGMA foreign_keys = OFF;');
  try {
    await db.execAsync(`
      BEGIN;
      DROP TABLE IF EXISTS sessions_legacy_pre_stress;
      ALTER TABLE sessions RENAME TO sessions_legacy_pre_stress;
      CREATE TABLE sessions (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT,
        exercise_id TEXT NOT NULL,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        duration_seconds INTEGER NOT NULL,
        pre_stress_level INTEGER,
        post_stress_level INTEGER,
        pre_stress_recorded INTEGER NOT NULL DEFAULT 0,
        post_stress_recorded INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        created_at TEXT NOT NULL,
        journey_id TEXT,
        journey_step_id TEXT,
        FOREIGN KEY (exercise_id) REFERENCES exercises(id)
      );
      INSERT INTO sessions (${copyColumns.join(', ')})
      SELECT ${sourceValues}
      FROM sessions_legacy_pre_stress;
      DROP TABLE sessions_legacy_pre_stress;
      CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);
      CREATE INDEX IF NOT EXISTS idx_sessions_exercise_id ON sessions(exercise_id);
      COMMIT;
    `);
  } catch (error) {
    try {
      await db.execAsync('ROLLBACK;');
    } catch {
      // Preserve the original migration error.
    }
    throw error;
  } finally {
    await db.execAsync('PRAGMA foreign_keys = ON;');
  }

}
