import { useState, useEffect, useCallback } from 'react';
import type { JourneyProgress, Session, SessionWithExercise } from '../types';
import {
  completeSession as completeDbSession,
  completeSessionAndJourney as completeDbSessionAndJourney,
  listSessions,
  startSession as startDbSession,
  updateSessionStatus as updateDbSessionStatus,
} from '../db';
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

  const completeSessionAndJourney = async (
    sessionId: string,
    durationSeconds: number,
    postStressLevel: number,
    notes: string | undefined,
    journeyId: string,
    chapterIndex: number
  ): Promise<{ progress: JourneyProgress | null; error: Error | null }> => {
    try {
      const result = await completeDbSessionAndJourney({
        sessionId,
        durationSeconds,
        postStressLevel,
        notes,
        journeyId,
        chapterIndex,
      });
      if (result.error) return result;
      await fetchSessions();
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to complete journey session');
      logger.error('completeSessionAndJourney:error', error, 'useSessions');
      return { progress: null, error };
    }
  };

  const getSessionStats = () => {
    const completedSessions = sessions.filter((s) => s.completed_at);
    const totalSessions = completedSessions.length;
    const totalMinutes = Math.round(
      completedSessions.reduce((acc, s) => acc + s.duration_seconds, 0) / 60
    );
    
    // Average the real stress delta over every session that recorded a post
    // value, not only the ones that improved (filtering to post < pre inflated
    // the figure and disagreed with the Progress screen). typeof guards a valid
    // post value of 0.
    const sessionsWithStress = completedSessions.filter(
      (s) => typeof s.post_stress_level === 'number'
    );

    const avgStressReduction =
      sessionsWithStress.length > 0
        ? sessionsWithStress.reduce(
            (acc, s) => acc + (s.pre_stress_level - (s.post_stress_level ?? 0)),
            0
          ) / sessionsWithStress.length
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
    completeSessionAndJourney,
    getSessionStats,
  };
};
