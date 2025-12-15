-- ============================================
-- Add more audio presets to enum
-- ============================================

-- Add new values to audio_preset enum
ALTER TYPE audio_preset ADD VALUE IF NOT EXISTS 'tibetan_bowl';
ALTER TYPE audio_preset ADD VALUE IF NOT EXISTS 'tibetan_bells';
ALTER TYPE audio_preset ADD VALUE IF NOT EXISTS 'wind';
ALTER TYPE audio_preset ADD VALUE IF NOT EXISTS 'creek';
ALTER TYPE audio_preset ADD VALUE IF NOT EXISTS 'solfeggio_741';
ALTER TYPE audio_preset ADD VALUE IF NOT EXISTS 'solfeggio_852';
ALTER TYPE audio_preset ADD VALUE IF NOT EXISTS 'schumann';
