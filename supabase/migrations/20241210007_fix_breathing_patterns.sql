-- ============================================
-- Add Missing Breathing Patterns
-- ============================================

-- Box Breathing: 4-4-4-4
UPDATE exercises SET breathing_pattern = '{"inhale": 4, "hold": 4, "exhale": 4, "rest": 4}'::jsonb
WHERE name ILIKE '%Box Breathing%' AND breathing_pattern IS NULL;

-- 4-7-8 Breathing
UPDATE exercises SET breathing_pattern = '{"inhale": 4, "hold": 7, "exhale": 8, "rest": 0}'::jsonb
WHERE name ILIKE '%4-7-8%' AND breathing_pattern IS NULL;

-- Physiological Sigh: double inhale
UPDATE exercises SET breathing_pattern = '{"inhale": 2, "hold": 0, "exhale": 8, "rest": 2, "special": "double_inhale"}'::jsonb
WHERE name ILIKE '%Physiological Sigh%' AND breathing_pattern IS NULL;

-- Diaphragmatic Breathing
UPDATE exercises SET breathing_pattern = '{"inhale": 4, "hold": 0, "exhale": 6, "rest": 2}'::jsonb
WHERE name ILIKE '%Diaphragmatic%' AND breathing_pattern IS NULL;

-- Resonant/Coherent Breathing: 5.5 in, 5.5 out
UPDATE exercises SET breathing_pattern = '{"inhale": 5, "hold": 0, "exhale": 5, "rest": 0}'::jsonb
WHERE (name ILIKE '%Resonant%' OR name ILIKE '%Coherent%') AND breathing_pattern IS NULL;

-- Alternate Nostril / Nadi Shodhana
UPDATE exercises SET breathing_pattern = '{"inhale": 4, "hold": 4, "exhale": 4, "rest": 0}'::jsonb
WHERE (name ILIKE '%Alternate Nostril%' OR name ILIKE '%Nadi Shodhana%') AND breathing_pattern IS NULL;

-- Ujjayi: ocean breath
UPDATE exercises SET breathing_pattern = '{"inhale": 5, "hold": 0, "exhale": 5, "rest": 0}'::jsonb
WHERE name ILIKE '%Ujjayi%' AND breathing_pattern IS NULL;

-- Kapalabhati: rapid exhale
UPDATE exercises SET breathing_pattern = '{"inhale": 0.5, "hold": 0, "exhale": 0.5, "rest": 0, "special": "rapid_exhale", "cycles": 30}'::jsonb
WHERE name ILIKE '%Kapalbhati%' AND breathing_pattern IS NULL;

-- Bhastrika: rapid equal
UPDATE exercises SET breathing_pattern = '{"inhale": 1, "hold": 0, "exhale": 1, "rest": 0, "special": "rapid", "cycles": 20}'::jsonb
WHERE name ILIKE '%Bhastrika%' AND breathing_pattern IS NULL;

-- Bhramari / Humming: hum on exhale
UPDATE exercises SET breathing_pattern = '{"inhale": 4, "hold": 0, "exhale": 8, "rest": 2, "special": "humming"}'::jsonb
WHERE (name ILIKE '%Bhramari%' OR name ILIKE '%Humming%') AND breathing_pattern IS NULL;

-- Lion's Breath: roar on exhale
UPDATE exercises SET breathing_pattern = '{"inhale": 4, "hold": 0, "exhale": 4, "rest": 2, "special": "roar"}'::jsonb
WHERE name ILIKE '%Lion%Breath%' AND breathing_pattern IS NULL;

-- Sitali: cooling breath
UPDATE exercises SET breathing_pattern = '{"inhale": 4, "hold": 2, "exhale": 6, "rest": 0}'::jsonb
WHERE name ILIKE '%Sitali%' AND breathing_pattern IS NULL;

-- Wim Hof: rapid + retention
UPDATE exercises SET breathing_pattern = '{"inhale": 2, "hold": 0, "exhale": 2, "rest": 0, "special": "wim_hof", "rapid_cycles": 30, "retention_seconds": 60}'::jsonb
WHERE name ILIKE '%Wim Hof%' AND breathing_pattern IS NULL;

-- Buteyko: reduced breathing
UPDATE exercises SET breathing_pattern = '{"inhale": 3, "hold": 0, "exhale": 3, "rest": 3}'::jsonb
WHERE name ILIKE '%Buteyko%' AND breathing_pattern IS NULL;

-- Holotropic: continuous
UPDATE exercises SET breathing_pattern = '{"inhale": 2, "hold": 0, "exhale": 2, "rest": 0, "special": "holotropic"}'::jsonb
WHERE name ILIKE '%Holotropic%' AND breathing_pattern IS NULL;

-- Qigong / Dan Tian
UPDATE exercises SET breathing_pattern = '{"inhale": 6, "hold": 2, "exhale": 6, "rest": 2}'::jsonb
WHERE (name ILIKE '%Qigong%' OR name ILIKE '%Dan Tian%') AND breathing_pattern IS NULL;

-- Reverse Breathing
UPDATE exercises SET breathing_pattern = '{"inhale": 4, "hold": 2, "exhale": 4, "rest": 2, "special": "reverse"}'::jsonb
WHERE name ILIKE '%Reverse%Breath%' AND breathing_pattern IS NULL;

-- Turtle Breathing: very slow
UPDATE exercises SET breathing_pattern = '{"inhale": 8, "hold": 4, "exhale": 8, "rest": 4}'::jsonb
WHERE name ILIKE '%Turtle%' AND breathing_pattern IS NULL;

-- Zazen: natural counting
UPDATE exercises SET breathing_pattern = '{"inhale": 4, "hold": 0, "exhale": 6, "rest": 0}'::jsonb
WHERE name ILIKE '%Zazen%' AND breathing_pattern IS NULL;

-- Hara Breathing
UPDATE exercises SET breathing_pattern = '{"inhale": 5, "hold": 3, "exhale": 5, "rest": 0}'::jsonb
WHERE name ILIKE '%Hara%' AND breathing_pattern IS NULL;

-- Nine-Round Purification
UPDATE exercises SET breathing_pattern = '{"inhale": 4, "hold": 2, "exhale": 4, "rest": 0, "special": "nine_rounds", "cycles": 9}'::jsonb
WHERE name ILIKE '%Nine%Round%' AND breathing_pattern IS NULL;

-- Tummo: inner fire
UPDATE exercises SET breathing_pattern = '{"inhale": 4, "hold": 8, "exhale": 4, "rest": 0}'::jsonb
WHERE name ILIKE '%Tummo%' AND breathing_pattern IS NULL;

-- Vase Breathing
UPDATE exercises SET breathing_pattern = '{"inhale": 4, "hold": 16, "exhale": 4, "rest": 0}'::jsonb
WHERE name ILIKE '%Vase%' AND breathing_pattern IS NULL;

-- Heart Breath
UPDATE exercises SET breathing_pattern = '{"inhale": 5, "hold": 0, "exhale": 5, "rest": 0}'::jsonb
WHERE name ILIKE '%Heart Breath%' AND breathing_pattern IS NULL;

-- Ha Breath (Hawaiian)
UPDATE exercises SET breathing_pattern = '{"inhale": 4, "hold": 0, "exhale": 4, "rest": 2, "special": "ha_sound"}'::jsonb
WHERE name ILIKE '%Ha Breath%' AND breathing_pattern IS NULL;

-- Tai Chi Standing
UPDATE exercises SET breathing_pattern = '{"inhale": 6, "hold": 0, "exhale": 6, "rest": 0}'::jsonb
WHERE name ILIKE '%Tai Chi%' AND breathing_pattern IS NULL;

-- Cold Exposure / Diving Reflex (no pattern needed - set default)
UPDATE exercises SET breathing_pattern = '{"inhale": 4, "hold": 4, "exhale": 6, "rest": 2}'::jsonb
WHERE category = 'water' AND breathing_pattern IS NULL;

-- Body Scan / Progressive Relaxation / Yoga Nidra
UPDATE exercises SET breathing_pattern = '{"inhale": 4, "hold": 0, "exhale": 6, "rest": 0}'::jsonb
WHERE (name ILIKE '%Body Scan%' OR name ILIKE '%Progressive%' OR name ILIKE '%Yoga Nidra%') AND breathing_pattern IS NULL;

-- Walking Meditation
UPDATE exercises SET breathing_pattern = '{"inhale": 3, "hold": 0, "exhale": 3, "rest": 0}'::jsonb
WHERE name ILIKE '%Walking%' AND breathing_pattern IS NULL;

-- 2-Minute Relaxation
UPDATE exercises SET breathing_pattern = '{"inhale": 4, "hold": 2, "exhale": 6, "rest": 0}'::jsonb
WHERE name ILIKE '%2-Minute%' AND breathing_pattern IS NULL;

-- Vocal Toning
UPDATE exercises SET breathing_pattern = '{"inhale": 4, "hold": 0, "exhale": 8, "rest": 2, "special": "humming"}'::jsonb
WHERE name ILIKE '%Vocal Toning%' AND breathing_pattern IS NULL;

-- Eye Movement (no breathing pattern needed)
UPDATE exercises SET breathing_pattern = '{"inhale": 4, "hold": 0, "exhale": 6, "rest": 0}'::jsonb
WHERE name ILIKE '%Eye Movement%' AND breathing_pattern IS NULL;

-- Five Tibetan Rites
UPDATE exercises SET breathing_pattern = '{"inhale": 4, "hold": 0, "exhale": 4, "rest": 0}'::jsonb
WHERE name ILIKE '%Tibetan%Rite%' OR name ILIKE '%Five Tibetan%' AND breathing_pattern IS NULL;

-- Military Sleep Method (no pattern needed)
UPDATE exercises SET breathing_pattern = '{"inhale": 4, "hold": 0, "exhale": 6, "rest": 0}'::jsonb
WHERE name ILIKE '%Military%Sleep%' AND breathing_pattern IS NULL;

-- Gargling (no pattern needed - set null to default)
UPDATE exercises SET breathing_pattern = '{"inhale": 4, "hold": 0, "exhale": 4, "rest": 2}'::jsonb
WHERE name ILIKE '%Gargling%' AND breathing_pattern IS NULL;

-- Default pattern for any remaining exercises without a pattern
UPDATE exercises SET breathing_pattern = '{"inhale": 4, "hold": 0, "exhale": 6, "rest": 2}'::jsonb
WHERE breathing_pattern IS NULL;
