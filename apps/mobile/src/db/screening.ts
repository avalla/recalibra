import { getDb } from './db';

function nowIso(): string {
  return new Date().toISOString();
}

export async function getScreening(): Promise<{
  meditation_experience: string;
  health_conditions: string[];
  initial_stress_level: number;
} | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{
    meditation_experience: string;
    health_conditions_json: string;
    initial_stress_level: number;
  }>('SELECT meditation_experience, health_conditions_json, initial_stress_level FROM screening WHERE id = 1');

  if (!row) return null;

  return {
    meditation_experience: row.meditation_experience,
    health_conditions: JSON.parse(row.health_conditions_json) as string[],
    initial_stress_level: row.initial_stress_level,
  };
}

export async function setScreening(next: {
  meditation_experience: string;
  health_conditions: string[];
  initial_stress_level: number;
}): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO screening (id, meditation_experience, health_conditions_json, initial_stress_level, updated_at) VALUES (1, ?, ?, ?, ?)',
    [next.meditation_experience, JSON.stringify(next.health_conditions), Math.floor(next.initial_stress_level), nowIso()]
  );
}
