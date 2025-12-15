import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts';
import type { Session, SessionInsert, SessionWithExercise } from '../types';

export const useSessions = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionWithExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async (limit = 20) => {
    if (!user) {
      setSessions([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('sessions')
        .select(`
          *,
          exercise:exercises(name, category, duration_minutes)
        `)
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;

      setSessions(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const startSession = async (
    exerciseId: string,
    preStressLevel: number
  ): Promise<{ data: Session | null; error: Error | null }> => {
    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    try {
      const sessionData: SessionInsert = {
        user_id: user.id,
        exercise_id: exerciseId,
        started_at: new Date().toISOString(),
        pre_stress_level: preStressLevel,
        duration_seconds: 0,
      };

      console.log('[startSession] Creating session:', sessionData);

      const { data, error } = await supabase
        .from('sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) {
        console.error('[startSession] Supabase error:', error);
        throw error;
      }

      console.log('[startSession] Session created:', data);
      return { data, error: null };
    } catch (err) {
      console.error('[startSession] Error:', err);
      return { data: null, error: err as Error };
    }
  };

  const updateSessionStatus = async (
    sessionId: string,
    status: 'started' | 'completed' | 'abandoned' | 'paused',
    durationSeconds?: number
  ): Promise<{ error: Error | null }> => {
    try {
      const updateData: Record<string, unknown> = { status };
      if (durationSeconds !== undefined) {
        updateData.duration_seconds = durationSeconds;
      }

      const { error } = await supabase
        .from('sessions')
        .update(updateData)
        .eq('id', sessionId);

      if (error) throw error;
      return { error: null };
    } catch (err) {
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
      const { error } = await supabase
        .from('sessions')
        .update({
          completed_at: new Date().toISOString(),
          duration_seconds: durationSeconds,
          post_stress_level: postStressLevel,
          notes,
          status: 'completed',
        })
        .eq('id', sessionId);

      if (error) throw error;

      // Refresh sessions list
      await fetchSessions();

      return { error: null };
    } catch (err) {
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
