export * from './navigation';

// ============================================
// Database Types
// ============================================

// Enums
export type MeditationExperience = 'none' | 'beginner' | 'intermediate' | 'advanced';
export type ExerciseCategory = 'breathing' | 'water' | 'movement' | 'sensory';
export type ExerciseLevel = 'beginner' | 'intermediate' | 'advanced';
export type ExerciseObjective = 'relax' | 'energy' | 'focus' | 'sleep';
export type ExerciseOrigin = 
  | 'india' 
  | 'china' 
  | 'japan' 
  | 'tibet' 
  | 'sufi' 
  | 'hawaii' 
  | 'usa' 
  | 'universal'
  | 'russia'
  | 'korea'
  | 'indonesia'
  | 'africa'
  | 'greece'
  | 'native_america'
  | 'brazil'
  | 'australia'
  | 'scandinavia'
  | 'mexico'
  | 'thailand'
  | 'mongolia'
  | 'persia'
  | 'netherlands';
export type ReminderTime = 'morning' | 'afternoon' | 'evening';
export type AudioPreset = 
  | 'silence'
  | 'binaural_alpha'
  | 'binaural_theta'
  | 'binaural_delta'
  | 'solfeggio_396'
  | 'solfeggio_432'
  | 'solfeggio_528'
  | 'solfeggio_639'
  | 'om'
  | 'nature_rain'
  | 'nature_ocean'
  | 'nature_forest';

// User metadata (stored in auth.users.user_metadata)
export interface UserMetadata {
  full_name?: string;
  avatar_url?: string;
  onboarding_completed?: boolean;
}

// Screening Profile
export interface ScreeningProfile {
  id: string;
  user_id: string;
  meditation_experience: MeditationExperience;
  health_conditions: string[];
  initial_stress_level: number;
  created_at: string;
  updated_at: string;
}

export type ScreeningProfileInsert = Omit<ScreeningProfile, 'id' | 'created_at' | 'updated_at'>;

// Exercise
export interface ExerciseInstruction {
  step: number;
  instruction: string;
}

export type GuidanceMode = 'automatic' | 'manual';
export type GuidanceSpeed = 'slow' | 'normal' | 'fast';

export type GuidedAction =
  | { type: 'speak'; text: string }
  | { type: 'show'; text: string }
  | { type: 'wait'; durationMs: number }
  | { type: 'visual'; cue: string; durationMs?: number }
  | { type: 'haptic'; pattern: 'light' | 'medium' }
  | { type: 'repeat'; times: number; actions: readonly GuidedAction[] };

export interface GuidedStep {
  id: string;
  instruction: string;
  visualCue?: string;
  actions: readonly GuidedAction[];
}

export interface GuidedPlan {
  mode: GuidanceMode;
  recommendedMode: GuidanceMode;
  steps: readonly GuidedStep[];
  supportsSpeed?: boolean;
}

export interface BreathingPattern {
  inhale: number;
  hold: number;
  exhale: number;
  rest: number;
  special?: 'double_inhale' | 'humming' | 'roar' | 'rapid' | 'rapid_exhale' | 'wim_hof' | 'holotropic' | 'reverse' | 'nine_rounds' | 'ha_sound' | 'viloma';
  cycles?: number;
  rapid_cycles?: number;
  retention_seconds?: number;
}

export interface ExerciseMediaItem {
  type: 'image' | 'video';
  uri: string;
  poster_uri?: string;
}

export interface Exercise {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: ExerciseCategory;
  objective: ExerciseObjective;
  level: ExerciseLevel;
  duration_minutes: number;
  image_url?: string;
  media?: ExerciseMediaItem[];
  instructions: ExerciseInstruction[];
  safety_warning?: string;
  audio_preset: AudioPreset;
  origin?: ExerciseOrigin;
  is_premium: boolean;
  is_active: boolean;
  breathing_pattern?: BreathingPattern;
  history?: string;
  benefits?: string[];
  tips?: string[];
  guidedPlan?: GuidedPlan;
  created_at: string;
  updated_at: string;
}

// Session
export interface Session {
  id: string;
  user_id: string;
  exercise_id: string;
  started_at: string;
  completed_at?: string;
  duration_seconds: number;
  pre_stress_level: number | null;
  post_stress_level?: number;
  pre_stress_recorded?: boolean;
  post_stress_recorded?: boolean;
  notes?: string;
  journey_id?: string;
  journey_step_id?: string;
  created_at: string;
}

export type SessionInsert = Omit<Session, 'id' | 'created_at'>;

// Session with exercise info (for display)
export interface SessionWithExercise extends Session {
  exercise: Pick<Exercise, 'name' | 'category' | 'duration_minutes'>;
}

// Favorite
export interface Favorite {
  user_id: string;
  exercise_id: string;
  created_at: string;
}

// Notification Settings
export interface NotificationSettings {
  user_id: string;
  reminders_enabled: boolean;
  reminder_time_of_day: ReminderTime;
  reminders_per_day: number;
  reminder_types: string[];
  push_token?: string;
  created_at: string;
  updated_at: string;
}

export type NotificationSettingsInsert = Omit<NotificationSettings, 'created_at' | 'updated_at'>;

// ============================================
// App-specific Types
// ============================================

// Progress/Analytics
export interface DailyProgress {
  date: string;
  sessions_completed: number;
  total_minutes: number;
  average_stress_reduction: number;
}

export interface WeeklyStats {
  week_start_date: string;
  total_sessions: number;
  total_minutes: number;
  average_stress_level: number;
  stress_reduction_percent: number;
}

// Exercise with favorite status (for catalog)
export interface ExerciseWithFavorite extends Exercise {
  is_favorite: boolean;
}

// ============================================
// Journey content and local progress
// ============================================

export type JourneyProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface JourneyStep {
  id: string;
  exerciseId: string;
  title: string;
  description?: string;
  order: number;
}

export interface Chapter {
  id: string;
  title: string;
  description?: string;
  order: number;
  steps: readonly JourneyStep[];
}

export interface Journey {
  id: string;
  version: number;
  slug: string;
  title: string;
  description: string;
  chapters: readonly Chapter[];
}

export interface JourneyProgress {
  journeyId: string;
  journeyVersion: number;
  status: JourneyProgressStatus;
  currentChapterId?: string;
  currentStepId?: string;
  startedAt?: string;
  completedAt?: string;
  updatedAt: string;
  completedStepIds: readonly string[];
}
