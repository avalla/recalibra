export const SCHEMA_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS exercises (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  objective TEXT NOT NULL DEFAULT 'relax',
  level TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  image_url TEXT,
  media_json TEXT,
  instructions_json TEXT NOT NULL,
  safety_warning TEXT,
  audio_preset TEXT NOT NULL,
  origin TEXT,
  is_premium INTEGER NOT NULL,
  is_active INTEGER NOT NULL,
  breathing_pattern_json TEXT,
  history TEXT,
  benefits_json TEXT,
  tips_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS favorites (
  exercise_id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY NOT NULL,
  exercise_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  duration_seconds INTEGER NOT NULL,
  pre_stress_level INTEGER NOT NULL,
  post_stress_level INTEGER,
  pre_stress_recorded INTEGER NOT NULL DEFAULT 0,
  post_stress_recorded INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_sessions_exercise_id ON sessions(exercise_id);

CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
  session_goal INTEGER NOT NULL,
  minutes_goal INTEGER NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reminders (
  id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
  enabled INTEGER NOT NULL,
  time TEXT NOT NULL,
  days_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS screening (
  id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
  meditation_experience TEXT NOT NULL,
  health_conditions_json TEXT NOT NULL,
  initial_stress_level INTEGER NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS journeys (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  total_chapters INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS journey_progress (
  journey_id TEXT PRIMARY KEY NOT NULL,
  journey_version INTEGER NOT NULL CHECK (journey_version > 0),
  status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')),
  current_chapter_id TEXT,
  current_step_id TEXT,
  started_at TEXT,
  completed_at TEXT,
  updated_at TEXT NOT NULL,
  completed_step_ids_json TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS journey_step_progress (
  journey_id TEXT NOT NULL,
  step_id TEXT NOT NULL,
  session_id TEXT NOT NULL UNIQUE,
  completed_at TEXT NOT NULL,
  PRIMARY KEY (journey_id, step_id),
  FOREIGN KEY (journey_id) REFERENCES journey_progress(journey_id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
`;
