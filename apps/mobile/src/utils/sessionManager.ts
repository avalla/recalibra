import { logger } from './logger';
import { cacheManager } from './cache';
import { completeSession as completeDbSession, listSessions, startSession as startDbSession } from '../db';

export interface SessionData {
  id?: string;
  exercise_id: string;
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  pre_stress_level: number;
  post_stress_level?: number;
  notes?: string;
}

export class SessionManager {
  private static instance: SessionManager;
  private currentSession: SessionData | null = null;
  private sessionStartTime: number | null = null;
  
  private constructor() {}
  
  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  // Start a new session
  async startSession(exerciseId: string, preStressLevel: number): Promise<boolean> {
    try {
      const result = await startDbSession({ exerciseId, preStressLevel });
      if (result.error || !result.data) throw result.error;

      const session: SessionData = {
        id: result.data.id,
        exercise_id: result.data.exercise_id,
        started_at: result.data.started_at,
        pre_stress_level: result.data.pre_stress_level,
        duration_seconds: result.data.duration_seconds,
      };

      // Set current session
      this.currentSession = session;
      this.sessionStartTime = Date.now();
      
      // Cache the session
      await cacheManager.setCache(`current_session_${exerciseId}`, session, 24 * 60 * 60 * 1000); // 24 hours
      
      logger.info(`Started session for exercise: ${exerciseId}`, 'SessionManager');
      return true;
    } catch (error) {
      logger.error('Error starting session', error as Error, 'SessionManager');
      return false;
    }
  }
  
  // Complete a session
  async completeSession(postStressLevel?: number, notes?: string): Promise<boolean> {
    if (!this.currentSession || !this.currentSession.id) {
      logger.warn('No active session to complete', 'SessionManager');
      return false;
    }
    
    try {
      // Calculate duration
      const durationSeconds = this.sessionStartTime 
        ? Math.floor((Date.now() - this.sessionStartTime) / 1000)
        : 0;
      
      const updateData: Partial<SessionData> = {
        completed_at: new Date().toISOString(),
        duration_seconds: durationSeconds,
      };
      
      if (postStressLevel !== undefined) {
        updateData.post_stress_level = postStressLevel;
      }
      
      if (notes !== undefined) {
        updateData.notes = notes;
      }

      const result = await completeDbSession({
        sessionId: this.currentSession.id,
        durationSeconds,
        postStressLevel: postStressLevel ?? null,
        notes,
      });
      if (result.error) throw result.error;
      
      // Update current session
      this.currentSession = {
        ...this.currentSession,
        ...updateData,
      };
      
      // Update cache
      if (this.currentSession.exercise_id) {
        await cacheManager.setCache(
          `current_session_${this.currentSession.exercise_id}`, 
          this.currentSession, 
          24 * 60 * 60 * 1000
        );
      }
      
      logger.info(`Completed session: ${this.currentSession.id}`, 'SessionManager');
      return true;
    } catch (error) {
      logger.error('Error completing session', error as Error, 'SessionManager');
      return false;
    }
  }
  
  // Cancel a session
  async cancelSession(): Promise<boolean> {
    if (!this.currentSession || !this.currentSession.id) {
      logger.warn('No active session to cancel', 'SessionManager');
      return false;
    }
    
    try {
      // Not implemented in SQLite layer yet (we can add if needed)
      
      // Clear current session
      this.currentSession = null;
      this.sessionStartTime = null;
      
      logger.info('Cancelled current session', 'SessionManager');
      return true;
    } catch (error) {
      logger.error('Error cancelling session', error as Error, 'SessionManager');
      return false;
    }
  }
  
  // Get current session
  getCurrentSession(): SessionData | null {
    return this.currentSession;
  }
  
  // Get session duration in seconds
  getSessionDuration(): number {
    if (!this.sessionStartTime) return 0;
    return Math.floor((Date.now() - this.sessionStartTime) / 1000);
  }
  
  // Check if there's an active session
  hasActiveSession(): boolean {
    return this.currentSession !== null && !this.currentSession.completed_at;
  }
  
  // Get recent sessions
  async getRecentSessions(limit: number = 10): Promise<SessionData[]> {
    try {
      // Try cache first
      const cachedSessions = await cacheManager.getCache<SessionData[]>(`recent_sessions_${limit}`);
      if (cachedSessions) {
        return cachedSessions;
      }

      const data = await listSessions(limit);
      const sorted: SessionData[] = data.map((s) => ({
        id: s.id,
        exercise_id: s.exercise_id,
        started_at: s.started_at,
        completed_at: s.completed_at,
        duration_seconds: s.duration_seconds,
        pre_stress_level: s.pre_stress_level,
        post_stress_level: s.post_stress_level,
        notes: s.notes,
      }));

      // Cache results for 5 minutes
      await cacheManager.setCache(`recent_sessions_${limit}`, sorted, 5 * 60 * 1000);

      return sorted;
    } catch (error) {
      logger.error('Error fetching recent sessions', error as Error, 'SessionManager');
      return [];
    }
  }
  
  // Get sessions by exercise
  async getSessionsByExercise(exerciseId: string): Promise<SessionData[]> {
    try {
      const data = await listSessions(200);
      return data
        .filter((s) => s.exercise_id === exerciseId)
        .map((s) => ({
          id: s.id,
          exercise_id: s.exercise_id,
          started_at: s.started_at,
          completed_at: s.completed_at,
          duration_seconds: s.duration_seconds,
          pre_stress_level: s.pre_stress_level,
          post_stress_level: s.post_stress_level,
          notes: s.notes,
        }));
    } catch (error) {
      logger.error(`Error fetching sessions for exercise: ${exerciseId}`, error as Error, 'SessionManager');
      return [];
    }
  }
  
  // Clear current session (for cleanup)
  clearCurrentSession(): void {
    this.currentSession = null;
    this.sessionStartTime = null;
  }
}

export const sessionManager = SessionManager.getInstance();

// Helper functions
export const startSession = async (exerciseId: string, preStressLevel: number): Promise<boolean> => {
  return await sessionManager.startSession(exerciseId, preStressLevel);
};

export const completeSession = async (postStressLevel?: number, notes?: string): Promise<boolean> => {
  return await sessionManager.completeSession(postStressLevel, notes);
};

export const cancelSession = async (): Promise<boolean> => {
  return await sessionManager.cancelSession();
};

export const hasActiveSession = (): boolean => {
  return sessionManager.hasActiveSession();
};
