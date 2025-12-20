import { getDb } from './db';

function nowIso(): string {
  return new Date().toISOString();
}

export async function getGoals(): Promise<{ sessionGoal: number; minutesGoal: number }> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ session_goal: number; minutes_goal: number }>(
    'SELECT session_goal, minutes_goal FROM goals WHERE id = 1'
  );
  return {
    sessionGoal: row?.session_goal ?? 3,
    minutesGoal: row?.minutes_goal ?? 30,
  };
}

export async function setGoals(next: { sessionGoal: number; minutesGoal: number }): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO goals (id, session_goal, minutes_goal, updated_at) VALUES (1, ?, ?, ?)',
    [Math.floor(next.sessionGoal), Math.floor(next.minutesGoal), nowIso()]
  );
}

export async function getReminders(): Promise<{ enabled: boolean; time: string; days: number[] }> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ enabled: number; time: string; days_json: string }>(
    'SELECT enabled, time, days_json FROM reminders WHERE id = 1'
  );
  return {
    enabled: (row?.enabled ?? 0) === 1,
    time: row?.time ?? '09:00',
    days: row?.days_json ? (JSON.parse(row.days_json) as number[]) : [1, 2, 3, 4, 5],
  };
}

export async function setReminders(next: { enabled: boolean; time: string; days: number[] }): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO reminders (id, enabled, time, days_json, updated_at) VALUES (1, ?, ?, ?, ?)',
    [next.enabled ? 1 : 0, next.time, JSON.stringify(next.days), nowIso()]
  );
}

export async function getScreening(): Promise<{ meditation_experience: string; health_conditions: string[]; initial_stress_level: number } | null> {
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
