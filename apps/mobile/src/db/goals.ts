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
