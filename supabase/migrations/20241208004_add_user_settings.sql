-- ============================================
-- User settings table for preferences
-- ============================================

CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  -- Reminder settings
  reminder_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  reminder_time TEXT NOT NULL DEFAULT '09:00',
  reminder_days INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}',
  -- Weekly goals
  weekly_session_goal INTEGER NOT NULL DEFAULT 3,
  weekly_minutes_goal INTEGER NOT NULL DEFAULT 30,
  -- App preferences
  dark_mode BOOLEAN NOT NULL DEFAULT TRUE,
  haptic_feedback BOOLEAN NOT NULL DEFAULT TRUE,
  sound_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS for user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);
