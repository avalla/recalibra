-- ============================================
-- Recalibra Database Schema
-- ============================================

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE meditation_experience AS ENUM ('none', 'beginner', 'intermediate', 'advanced');
CREATE TYPE exercise_category AS ENUM ('breathing', 'water', 'movement', 'sensory');
CREATE TYPE exercise_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE reminder_time AS ENUM ('morning', 'afternoon', 'evening');

-- ============================================
-- SCREENING PROFILES
-- ============================================

CREATE TABLE screening_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meditation_experience meditation_experience NOT NULL DEFAULT 'none',
  health_conditions TEXT[] DEFAULT '{}',
  initial_stress_level INTEGER NOT NULL CHECK (initial_stress_level >= 1 AND initial_stress_level <= 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- RLS for screening_profiles
ALTER TABLE screening_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own screening profile"
  ON screening_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own screening profile"
  ON screening_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own screening profile"
  ON screening_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- EXERCISES (Catalog)
-- ============================================

CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category exercise_category NOT NULL,
  level exercise_level NOT NULL DEFAULT 'beginner',
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  image_url TEXT,
  instructions JSONB NOT NULL DEFAULT '[]',
  safety_warning TEXT,
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS for exercises (public read)
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active exercises"
  ON exercises FOR SELECT
  USING (is_active = TRUE);

-- ============================================
-- SESSIONS (User exercise sessions)
-- ============================================

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  pre_stress_level INTEGER NOT NULL CHECK (pre_stress_level >= 1 AND pre_stress_level <= 10),
  post_stress_level INTEGER CHECK (post_stress_level >= 1 AND post_stress_level <= 10),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for sessions
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_exercise_id ON sessions(exercise_id);
CREATE INDEX idx_sessions_started_at ON sessions(started_at DESC);

-- RLS for sessions
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- FAVORITES
-- ============================================

CREATE TABLE favorites (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  PRIMARY KEY (user_id, exercise_id)
);

-- RLS for favorites
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- NOTIFICATION SETTINGS
-- ============================================

CREATE TABLE notification_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  reminders_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  reminder_time_of_day reminder_time NOT NULL DEFAULT 'morning',
  reminders_per_day INTEGER NOT NULL DEFAULT 2 CHECK (reminders_per_day >= 1 AND reminders_per_day <= 5),
  reminder_types TEXT[] DEFAULT ARRAY['breathing'],
  push_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS for notification_settings
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification settings"
  ON notification_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification settings"
  ON notification_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings"
  ON notification_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_screening_profiles_updated_at
  BEFORE UPDATE ON screening_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_exercises_updated_at
  BEFORE UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
