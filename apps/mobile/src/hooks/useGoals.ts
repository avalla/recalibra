import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSessions } from './useSessions';
import { getGoals as getGoalsFromDb, setGoals as setGoalsInDb } from '../db';

export interface WeeklyGoals {
  sessionGoal: number;
  minutesGoal: number;
}

const DEFAULT_GOALS: WeeklyGoals = {
  sessionGoal: 3,
  minutesGoal: 30,
};

export const useGoals = () => {
  const { sessions } = useSessions();
  const [goals, setGoals] = useState<WeeklyGoals>(DEFAULT_GOALS);
  const [isLoading, setIsLoading] = useState(true);

  // Load goals from local storage
  const loadGoals = useCallback(async () => {
    try {
      const data = await getGoalsFromDb();
      setGoals({
        sessionGoal: data.sessionGoal,
        minutesGoal: data.minutesGoal,
      });
    } catch (err) {
      console.log('[Goals] No settings found, using defaults');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save goals to local storage
  const saveGoals = async (newGoals: Partial<WeeklyGoals>) => {
    const updatedGoals = { ...goals, ...newGoals };
    setGoals(updatedGoals);

    try {
      await setGoalsInDb({ sessionGoal: updatedGoals.sessionGoal, minutesGoal: updatedGoals.minutesGoal });
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
