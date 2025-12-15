import { supabase } from '../lib/supabase';
import { logger } from './logger';
import { cacheManager } from './cache';

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
      const session: SessionData = {
        exercise_id: exerciseId,
        started_at: new Date().toISOString(),
        pre_stress_level: preStressLevel,
      };
      
      // Save to Supabase
      const { data, error } = await supabase
        .from('sessions')
        .insert(session)
        .select()
        .single();
      
      if (error) throw error;
      
      // Set current session
      this.currentSession = data;
      this.sessionStartTime = Date.now();
      
      // Cache the session
      await cacheManager.setCache(`current_session_${exerciseId}`, data, 24 * 60 * 60 * 1000); // 24 hours
      
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
      
      // Update in Supabase
      const { error } = await supabase
        .from('sessions')
        .update(updateData)
        .eq('id', this.currentSession.id);
      
      if (error) throw error;
      
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
      // Delete from Supabase
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', this.currentSession.id);
      
      if (error) throw error;
      
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
      
      // Fetch from Supabase
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      // Cache results for 5 minutes
      await cacheManager.setCache(`recent_sessions_${limit}`, data || [], 5 * 60 * 1000);
      
      return data || [];
    } catch (error) {
      logger.error('Error fetching recent sessions', error as Error, 'SessionManager');
      return [];
    }
  }
  
  // Get sessions by exercise
  async getSessionsByExercise(exerciseId: string): Promise<SessionData[]> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('exercise_id', exerciseId)
        .order('started_at', { ascending: false });
      
      if (error) throw error;
      
      return data || [];
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
