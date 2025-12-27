import { getDb } from './db';

function nowIso(): string {
  return new Date().toISOString();
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
