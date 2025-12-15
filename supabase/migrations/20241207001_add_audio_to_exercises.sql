-- ============================================
-- Add audio preset to exercises
-- ============================================

-- Audio preset enum
CREATE TYPE audio_preset AS ENUM (
  'silence',
  'binaural_alpha',
  'binaural_theta', 
  'binaural_delta',
  'solfeggio_396',
  'solfeggio_432',
  'solfeggio_528',
  'solfeggio_639',
  'om',
  'nature_rain',
  'nature_ocean',
  'nature_forest'
);

-- Add audio_preset column to exercises
ALTER TABLE exercises 
ADD COLUMN audio_preset audio_preset NOT NULL DEFAULT 'silence';

-- Update existing exercises with appropriate audio presets
UPDATE exercises SET audio_preset = 'binaural_alpha' WHERE category = 'breathing';
UPDATE exercises SET audio_preset = 'nature_ocean' WHERE category = 'water';
UPDATE exercises SET audio_preset = 'solfeggio_432' WHERE category = 'movement';
UPDATE exercises SET audio_preset = 'om' WHERE category = 'sensory';
