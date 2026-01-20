import { useState, useEffect, useCallback } from 'react';
import type { Session, SessionWithExercise } from '../types';
import { listSessions, startSession as startDbSession, updateSessionStatus as updateDbSessionStatus, completeSession as completeDbSession } from '../db';
import { logger } from '../utils/logger';

export const useSessions = () => {
  const [sessions, setSessions] = useState<SessionWithExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async (limit = 20) => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await listSessions(limit);
      logger.debug(`fetch:ok returned=${data.length}`, 'useSessions');
      setSessions(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch sessions');
      logger.error('fetch:error', error, 'useSessions');
      setError(error.message);
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
      logger.debug(`startSession:start exerciseId=${exerciseId}`, 'useSessions');
      const result = await startDbSession({ exerciseId, preStressLevel });
      if (result.error) return { data: null, error: result.error };
      await fetchSessions();
      return { data: result.data, error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(typeof err === 'string' ? err : 'Failed to start session');
      logger.error('startSession:error', error, 'useSessions');
      return { data: null, error };
    }
  };

  const updateSessionStatus = async (
    sessionId: string,
    status: 'started' | 'completed' | 'abandoned' | 'paused',
    durationSeconds?: number
  ): Promise<{ error: Error | null }> => {
    try {
      logger.debug(`updateSessionStatus:start status=${status}`, 'useSessions');
      const result = await updateDbSessionStatus({ sessionId, status, durationSeconds });
      if (result.error) return { error: result.error };
      await fetchSessions();
      logger.debug('updateSessionStatus:ok', 'useSessions');
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update session');
      logger.error('updateSessionStatus:error', error, 'useSessions');
      return { error };
    }
  };

  const completeSession = async (
    sessionId: string,
    durationSeconds: number,
    postStressLevel: number,
    notes?: string
  ): Promise<{ error: Error | null }> => {
    try {
      logger.debug('completeSession:start', 'useSessions');
      const result = await completeDbSession({ sessionId, durationSeconds, postStressLevel, notes });
      if (result.error) return { error: result.error };
      await fetchSessions();
      logger.debug('completeSession:ok', 'useSessions');
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to complete session');
      logger.error('completeSession:error', error, 'useSessions');
      return { error };
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
