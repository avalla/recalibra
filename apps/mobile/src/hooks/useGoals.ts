import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts';
import { useSessions } from './useSessions';

export interface WeeklyGoals {
  sessionGoal: number;
  minutesGoal: number;
}

const DEFAULT_GOALS: WeeklyGoals = {
  sessionGoal: 3,
  minutesGoal: 30,
};

export const useGoals = () => {
  const { user } = useAuth();
  const { sessions } = useSessions();
  const [goals, setGoals] = useState<WeeklyGoals>(DEFAULT_GOALS);
  const [isLoading, setIsLoading] = useState(true);

  // Load goals from Supabase
  const loadGoals = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('weekly_session_goal, weekly_minutes_goal')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setGoals({
          sessionGoal: data.weekly_session_goal ?? 3,
          minutesGoal: data.weekly_minutes_goal ?? 30,
        });
      }
    } catch (err) {
      console.log('[Goals] No settings found, using defaults');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Save goals to Supabase
  const saveGoals = async (newGoals: Partial<WeeklyGoals>) => {
    if (!user) return;

    const updatedGoals = { ...goals, ...newGoals };
    setGoals(updatedGoals);

    try {
      await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          weekly_session_goal: updatedGoals.sessionGoal,
          weekly_minutes_goal: updatedGoals.minutesGoal,
        }, {
          onConflict: 'user_id',
        });
    } catch (err) {
      console.error('[Goals] Error saving goals:', err);
    }
  };

  // Calculate current week progress
  const weekProgress = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0
    startOfWeek.setDate(now.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const weekSessions = sessions.filter((s) => {
      const sessionDate = new Date(s.created_at);
      return sessionDate >= startOfWeek && s.completed_at;
    });

    const sessionsCompleted = weekSessions.length;
    const minutesCompleted = weekSessions.reduce(
      (sum, s) => sum + Math.round(s.duration_seconds / 60),
      0
    );

    return {
      sessionsCompleted,
      minutesCompleted,
      sessionProgress: Math.min(1, sessionsCompleted / goals.sessionGoal),
      minutesProgress: Math.min(1, minutesCompleted / goals.minutesGoal),
      sessionGoalMet: sessionsCompleted >= goals.sessionGoal,
      minutesGoalMet: minutesCompleted >= goals.minutesGoal,
    };
  }, [sessions, goals]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  return {
    goals,
    weekProgress,
    isLoading,
    saveGoals,
  };
};
