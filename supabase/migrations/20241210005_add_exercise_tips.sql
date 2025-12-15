-- ============================================
-- Add Tips column to Exercises
-- ============================================

ALTER TABLE exercises ADD COLUMN IF NOT EXISTS tips TEXT[];

-- ============================================
-- Update exercises with tips
-- ============================================

-- Box Breathing
UPDATE exercises SET tips = ARRAY[
  'Used by Navy SEALs for stress control',
  'Keep equal timing for all 4 phases',
  'Focus on the corners of the "box"'
] WHERE name ILIKE '%Box Breathing%';

-- 4-7-8 Breathing
UPDATE exercises SET tips = ARRAY[
  'Created by Dr. Andrew Weil',
  'Acts as a natural tranquilizer',
  'Best done before sleep'
] WHERE name ILIKE '%4-7-8%';

-- Physiological Sigh
UPDATE exercises SET tips = ARRAY[
  'The double inhale is key - it opens collapsed air sacs',
  'Make the exhale at least twice as long as inhale',
  'This is the fastest way to calm your nervous system'
] WHERE name ILIKE '%Physiological Sigh%';

-- Alternate Nostril / Nadi Shodhana
UPDATE exercises SET tips = ARRAY[
  'Keep breathing slow and even',
  'Balances left and right brain hemispheres',
  'Great for focus and calming anxiety'
] WHERE name ILIKE '%Alternate Nostril%' OR name ILIKE '%Nadi Shodhana%';

-- Ujjayi
UPDATE exercises SET tips = ARRAY[
  'Imagine fogging a mirror with your breath',
  'Keep the sound soft, not forced',
  'Used throughout yoga practice for focus'
] WHERE name ILIKE '%Ujjayi%';

-- Sitali
UPDATE exercises SET tips = ARRAY[
  'Cools the body and calms the mind',
  'Good for hot weather or anger',
  'Avoid in cold weather or with respiratory issues'
] WHERE name ILIKE '%Sitali%';

-- Bhramari / Humming
UPDATE exercises SET tips = ARRAY[
  'The vibration directly stimulates your vagus nerve',
  'Lower pitches create stronger vibrations',
  'Great for anxiety and before sleep'
] WHERE name ILIKE '%Bhramari%' OR name ILIKE '%Humming%';

-- Lion''s Breath
UPDATE exercises SET tips = ARRAY[
  'Really stretch your face muscles!',
  'Let go of embarrassment - this is liberating',
  'Great for releasing jaw tension and stress'
] WHERE name ILIKE '%Lion%Breath%';

-- Wim Hof
UPDATE exercises SET tips = ARRAY[
  'Never practice in water or while driving!',
  'Tingling and light-headedness are normal',
  'The retention gets easier with practice',
  'Optional: follow with cold shower'
] WHERE name ILIKE '%Wim Hof%';

-- Kapalbhati
UPDATE exercises SET tips = ARRAY[
  'Focus on the exhale - inhale is passive',
  'Keep your chest and shoulders still',
  'Stop if you feel dizzy'
] WHERE name ILIKE '%Kapalbhati%';

-- Resonant Breathing
UPDATE exercises SET tips = ARRAY[
  'This rate (5.5 breaths/min) optimizes heart rate variability',
  'Creates "coherence" between heart and brain',
  'Most calming breathing rate for most people'
] WHERE name ILIKE '%Resonant%' OR name ILIKE '%Coherent%';

-- Cold Exposure
UPDATE exercises SET tips = ARRAY[
  'Start with just 15 seconds and build up',
  'Cold activates the vagus nerve',
  'Breathe slowly to stay calm'
] WHERE name ILIKE '%Cold%' AND category = 'water';

-- Tummo
UPDATE exercises SET tips = ARRAY[
  'Advanced Tibetan Buddhist practice',
  'Can actually raise body temperature',
  'Learn from qualified teacher for full practice'
] WHERE name ILIKE '%Tummo%';

-- Ha Breath
UPDATE exercises SET tips = ARRAY[
  '"Ha" means breath of life in Hawaiian',
  'Used in Huna tradition for clearing energy',
  'Great for releasing stuck emotions'
] WHERE name ILIKE '%Ha Breath%';

-- Heart Breath
UPDATE exercises SET tips = ARRAY[
  'Focus on feelings of love and gratitude',
  'Can be done anytime you need centering',
  'Sufi tradition: breath is connection to divine'
] WHERE name ILIKE '%Heart Breath%';

-- Default tips for any without
UPDATE exercises SET tips = ARRAY[
  'Find a quiet, comfortable place',
  'Practice regularly for best results',
  'Stop if you feel dizzy or uncomfortable'
] WHERE tips IS NULL;
