import { useState, useEffect, useCallback } from 'react';
import type { Session, SessionWithExercise } from '../types';
import { listSessions, startSession as startDbSession, updateSessionStatus as updateDbSessionStatus, completeSession as completeDbSession } from '../db';

export const useSessions = () => {
  const [sessions, setSessions] = useState<SessionWithExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const log = (...args: unknown[]) => {
    if (!__DEV__) return;
    // eslint-disable-next-line no-console
    console.log('[useSessions:local]', ...args);
  };

  const fetchSessions = useCallback(async (limit = 20) => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await listSessions(limit);
      log('fetch:ok', { returned: data.length });
      setSessions(data);
    } catch (err) {
      log('fetch:error', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const startSession = async (
    exerciseId: string,
    preStressLevel: number,
    _exerciseMeta?: { name: string; category?: unknown; durationMinutes: number }
  ): Promise<{ data: Session | null; error: Error | null }> => {
    try {
      log('startSession:start', { exerciseId, preStressLevel });
      const result = await startDbSession({ exerciseId, preStressLevel });
      if (result.error) return { data: null, error: result.error };
      await fetchSessions();
      return { data: result.data, error: null };
    } catch (err) {
      log('startSession:error', err);
      if (err instanceof Error) return { data: null, error: err };
      return { data: null, error: new Error(typeof err === 'string' ? err : 'Failed to start session') };
    }
  };

  const updateSessionStatus = async (
    sessionId: string,
    status: 'started' | 'completed' | 'abandoned' | 'paused',
    durationSeconds?: number
  ): Promise<{ error: Error | null }> => {
    try {
      log('updateSessionStatus:start', { sessionId, status, durationSeconds });
      const result = await updateDbSessionStatus({ sessionId, status, durationSeconds });
      if (result.error) return { error: result.error };
      await fetchSessions();
      log('updateSessionStatus:ok');
      return { error: null };
    } catch (err) {
      log('updateSessionStatus:error', err);
      return { error: err as Error };
    }
  };

  const completeSession = async (
    sessionId: string,
    durationSeconds: number,
    postStressLevel: number,
    notes?: string
  ): Promise<{ error: Error | null }> => {
    try {
      log('completeSession:start', { sessionId, durationSeconds, postStressLevel, hasNotes: !!notes });
      const result = await completeDbSession({ sessionId, durationSeconds, postStressLevel, notes });
      if (result.error) return { error: result.error };
      await fetchSessions();
      log('completeSession:ok');
      return { error: null };
    } catch (err) {
      log('completeSession:error', err);
      return { error: err as Error };
    }
  };

  const getSessionStats = () => {
    const completedSessions = sessions.filter((s) => s.completed_at);
    const totalSessions = completedSessions.length;
    const totalMinutes = Math.round(
      completedSessions.reduce((acc, s) => acc + s.duration_seconds, 0) / 60
    );
    
    const sessionsWithStressReduction = completedSessions.filter(
      (s) => s.post_stress_level && s.post_stress_level < s.pre_stress_level
    );
    
    const avgStressReduction =
      sessionsWithStressReduction.length > 0
        ? sessionsWithStressReduction.reduce(
            (acc, s) => acc + (s.pre_stress_level - (s.post_stress_level || 0)),
            0
          ) / sessionsWithStressReduction.length
        : 0;

    return {
      totalSessions,
      totalMinutes,
      avgStressReduction: Math.round(avgStressReduction * 10) / 10,
    };
  };

  return {
    sessions,
    isLoading,
    error,
    refetch: fetchSessions,
    startSession,
    updateSessionStatus,
    completeSession,
    getSessionStats,
  };
};
