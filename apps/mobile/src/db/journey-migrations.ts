import type { SQLiteDatabase } from 'expo-sqlite';

export const JOURNEY_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS journey_progress (
  journey_id TEXT PRIMARY KEY NOT NULL,
  journey_version INTEGER NOT NULL CHECK (journey_version > 0),
  status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')),
  current_chapter_id TEXT,
  current_step_id TEXT,
  started_at TEXT,
  completed_at TEXT,
  updated_at TEXT NOT NULL,
  completed_step_ids_json TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS journey_step_progress (
  journey_id TEXT NOT NULL,
  step_id TEXT NOT NULL,
  session_id TEXT NOT NULL UNIQUE,
  completed_at TEXT NOT NULL,
  PRIMARY KEY (journey_id, step_id),
  FOREIGN KEY (journey_id) REFERENCES journey_progress(journey_id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_journey_step_progress_session
  ON journey_step_progress(session_id);
`;

/**
 * Adds Journey persistence without rewriting an existing local database.
 * CREATE IF NOT EXISTS and column checks make repeated app starts safe.
 */
export async function ensureJourneySchema(
  db: Pick<SQLiteDatabase, 'getAllAsync' | 'execAsync'>,
): Promise<void> {
  const existing = await db.getAllAsync<{ name: string }>('PRAGMA table_info(journey_progress)');
  if (existing.length > 0 && !existing.some((column) => column.name === 'journey_version')) {
    // The first Journey prototype used chapter-index JSON. Keep it intact under
    // a legacy name before installing the versioned step model.
    await db.execAsync('ALTER TABLE journey_progress RENAME TO journey_progress_legacy;');
  }
  await db.execAsync(JOURNEY_SCHEMA_SQL);

  const progressColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(journey_progress)');
  if (!progressColumns.some((column) => column.name === 'completed_step_ids_json')) {
    await db.execAsync("ALTER TABLE journey_progress ADD COLUMN completed_step_ids_json TEXT NOT NULL DEFAULT '[]';");
  }

  const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(sessions)');
  for (const name of ['journey_id', 'journey_step_id']) {
    if (!columns.some((column) => column.name === name)) {
      await db.execAsync(`ALTER TABLE sessions ADD COLUMN ${name} TEXT;`);
    }
  }
}
