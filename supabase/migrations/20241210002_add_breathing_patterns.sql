-- ============================================
-- Add Breathing Patterns to Exercises
-- ============================================

-- Add breathing_pattern column as JSONB
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS breathing_pattern JSONB;

-- ============================================
-- Set patterns for each exercise
-- Pattern format: { inhale, hold, exhale, rest } in seconds
-- Some exercises have special patterns (cycles, phases)
-- ============================================

-- Box Breathing: 4-4-4-4
UPDATE exercises SET breathing_pattern = '{"inhale": 4, "hold": 4, "exhale": 4, "rest": 4}'::jsonb
WHERE name ILIKE '%Box Breathing%';

-- 4-7-8 Breathing
UPDATE exercises SET breathing_pattern = '{"inhale": 4, "hold": 7, "exhale": 8, "rest": 0}'::jsonb
WHERE name ILIKE '%4-7-8%';

-- Diaphragmatic Breathing: slow 4-0-6-0
UPDATE exercises SET breathing_pattern = '{"inhale": 4, "hold": 0, "exhale": 6, "rest": 0}'::jsonb
WHERE name ILIKE '%Diaphragmatic%';

-- Resonant Breathing: 5.5 breaths per minute (5.5-0-5.5-0)
UPDATE exercises SET breathing_pattern = '{"inhale": 5.5, "hold": 0, "exhale": 5.5, "rest": 0}'::jsonb
WHERE name ILIKE '%Resonant%';

-- Alternate Nostril / Nadi Shodhana: 4-4-4-0
UPDATE exercises SET breathing_pattern = '{"inhale": 4, "hold": 4, "exhale": 4, "rest": 0}'::jsonb
WHERE name ILIKE '%Alternate Nostril%' OR name ILIKE '%Nadi Shodhana%';

-- Physiological Sigh: double inhale + long exhale (special pattern)
UPDATE exercises SET breathing_pattern = '{"inhale": 2, "hold": 0, "exhale": 8, "rest": 2, "special": "double_inhale"}'::jsonb
WHERE name ILIKE '%Physiological Sigh%';

-- Ujjayi: equal ratio 5-0-5-0
UPDATE exercises SET breathing_pattern = '{"inhale": 5, "hold": 0, "exhale": 5, "rest": 0}'::jsonb
WHERE name ILIKE '%Ujjayi%';

-- Kapalbhati: rapid exhales (special - 1 second cycles)
UPDATE exercises SET breathing_pattern = '{"inhale": 0.5, "hold": 0, "exhale": 0.5, "rest": 0, "special": "rapid_exhale", "cycles": 30}'::jsonb
WHERE name ILIKE '%Kapalbhati%' OR name ILIKE '%Kapalabhati%';

-- Bhramari: long exhale with humming
UPDATE exercises SET breathing_pattern = '{"inhale": 4, "hold": 0, "exhale": 8, "rest": 2, "special": "humming"}'::jsonb
WHERE name ILIKE '%Bhramari%';

-- Sitali: cooling breath 4-0-4-0
UPDATE exercises SET breathing_pattern = '{"inhale": 4, "hold": 0, "exhale": 4, "rest": 0}'::jsonb
WHERE name ILIKE '%Sitali%';

-- Lion's Breath: 4-0-4-2 with roar
UPDATE exercises SET breathing_pattern = '{"inhale": 4, "hold": 0, "exhale": 4, "rest": 2, "special": "roar"}'::jsonb
WHERE name ILIKE '%Lion%Breath%';

-- Bhastrika: rapid equal breaths
UPDATE exercises SET breathing_pattern = '{"inhale": 1, "hold": 0, "exhale": 1, "rest": 0, "special": "rapid", "cycles": 20}'::jsonb
WHERE name ILIKE '%Bhastrika%';

-- Qigong Breathing: slow deep 6-2-6-0
UPDATE exercises SET breathing_pattern = '{"inhale": 6, "hold": 2, "exhale": 6, "rest": 0}'::jsonb
WHERE name ILIKE '%Qigong%';

-- Zazen: natural slow 5-0-7-0
UPDATE exercises SET breathing_pattern = '{"inhale": 5, "hold": 0, "exhale": 7, "rest": 0}'::jsonb
WHERE name ILIKE '%Zazen%';

-- Hara Breathing: deep belly 5-2-5-2
UPDATE exercises SET breathing_pattern = '{"inhale": 5, "hold": 2, "exhale": 5, "rest": 2}'::jsonb
WHERE name ILIKE '%Hara%';

-- Nine-Round: alternating nostril 4-2-4-0
UPDATE exercises SET breathing_pattern = '{"inhale": 4, "hold": 2, "exhale": 4, "rest": 0, "special": "nine_rounds"}'::jsonb
WHERE name ILIKE '%Nine%Round%';

-- Tummo: deep hold 4-8-4-0
UPDATE exercises SET breathing_pattern = '{"inhale": 4, "hold": 8, "exhale": 4, "rest": 0}'::jsonb
WHERE name ILIKE '%Tummo%';

-- Vase Breathing: long hold 4-12-4-0
UPDATE exercises SET breathing_pattern = '{"inhale": 4, "hold": 12, "exhale": 4, "rest": 0}'::jsonb
WHERE name ILIKE '%Vase%';

-- Heart Breath: gentle 4-0-6-2
UPDATE exercises SET breathing_pattern = '{"inhale": 4, "hold": 0, "exhale": 6, "rest": 2}'::jsonb
WHERE name ILIKE '%Heart Breath%';

-- Ha Breath: 4-0-4-2 with HA sound
UPDATE exercises SET breathing_pattern = '{"inhale": 4, "hold": 0, "exhale": 4, "rest": 2, "special": "ha_sound"}'::jsonb
WHERE name ILIKE '%Ha Breath%';

-- Wim Hof: rapid then hold (special pattern)
UPDATE exercises SET breathing_pattern = '{"inhale": 2, "hold": 0, "exhale": 1, "rest": 0, "special": "wim_hof", "rapid_cycles": 30, "retention_seconds": 90}'::jsonb
WHERE name ILIKE '%Wim Hof%';

-- Buteyko: reduced breathing 3-0-4-3
UPDATE exercises SET breathing_pattern = '{"inhale": 3, "hold": 0, "exhale": 4, "rest": 3}'::jsonb
WHERE name ILIKE '%Buteyko%';

-- Holotropic: rapid continuous 1-0-1-0
UPDATE exercises SET breathing_pattern = '{"inhale": 1.5, "hold": 0, "exhale": 1.5, "rest": 0, "special": "holotropic"}'::jsonb
WHERE name ILIKE '%Holotropic%';

-- Reverse Breathing: 4-2-4-0
UPDATE exercises SET breathing_pattern = '{"inhale": 4, "hold": 2, "exhale": 4, "rest": 0, "special": "reverse"}'::jsonb
WHERE name ILIKE '%Reverse%';

-- Turtle Breathing: very slow 15-0-15-0
UPDATE exercises SET breathing_pattern = '{"inhale": 15, "hold": 0, "exhale": 15, "rest": 0}'::jsonb
WHERE name ILIKE '%Turtle%';

-- Tai Chi Standing: natural 5-0-5-0
UPDATE exercises SET breathing_pattern = '{"inhale": 5, "hold": 0, "exhale": 5, "rest": 0}'::jsonb
WHERE name ILIKE '%Tai Chi%';

-- Cold Water exercises: slow calming 4-0-8-0
UPDATE exercises SET breathing_pattern = '{"inhale": 4, "hold": 0, "exhale": 8, "rest": 0}'::jsonb
WHERE category = 'water';

-- Default for any exercise without pattern: 4-0-6-0
UPDATE exercises SET breathing_pattern = '{"inhale": 4, "hold": 0, "exhale": 6, "rest": 0}'::jsonb
WHERE breathing_pattern IS NULL;
