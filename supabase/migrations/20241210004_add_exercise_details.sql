-- ============================================
-- Add History and Benefits to Exercises
-- ============================================

-- Add new columns
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS history TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS benefits TEXT[];

-- ============================================
-- Update exercises with history and benefits
-- ============================================

-- Box Breathing
UPDATE exercises SET 
  history = 'Used by Navy SEALs for stress control in high-pressure situations.',
  benefits = ARRAY['Reduces stress', 'Improves focus', 'Regulates nervous system']
WHERE name ILIKE '%Box Breathing%';

-- 4-7-8 Breathing
UPDATE exercises SET 
  history = 'Developed by Dr. Andrew Weil based on pranayama techniques.',
  benefits = ARRAY['Natural sleep aid', 'Reduces anxiety', 'Calms the mind']
WHERE name ILIKE '%4-7-8%';

-- Physiological Sigh
UPDATE exercises SET 
  history = 'Discovered by Stanford researchers as the fastest way to calm down.',
  benefits = ARRAY['Instant calm', 'Reduces cortisol', 'Resets breathing']
WHERE name ILIKE '%Physiological Sigh%';

-- Alternate Nostril / Nadi Shodhana
UPDATE exercises SET 
  history = 'Ancient pranayama technique from Yoga tradition (~3000 BCE).',
  benefits = ARRAY['Balances hemispheres', 'Calms mind', 'Improves focus']
WHERE name ILIKE '%Alternate Nostril%' OR name ILIKE '%Nadi Shodhana%';

-- Ujjayi
UPDATE exercises SET 
  history = 'Ocean breath from Yoga, used in Ashtanga practice.',
  benefits = ARRAY['Warms the body', 'Calms nerves', 'Improves concentration']
WHERE name ILIKE '%Ujjayi%';

-- Sitali
UPDATE exercises SET 
  history = 'Cooling breath from ancient Hatha Yoga tradition.',
  benefits = ARRAY['Cools the body', 'Reduces anger', 'Calms the mind']
WHERE name ILIKE '%Sitali%';

-- Bhramari / Humming
UPDATE exercises SET 
  history = 'Bhramari pranayama (bee breath) from Yoga tradition.',
  benefits = ARRAY['Stimulates vagus nerve', 'Reduces anxiety', 'Improves sleep']
WHERE name ILIKE '%Bhramari%' OR name ILIKE '%Humming%';

-- Cold Exposure
UPDATE exercises SET 
  history = 'Ancient practice found in many cultures; popularized by Wim Hof.',
  benefits = ARRAY['Activates vagus nerve', 'Boosts immunity', 'Increases alertness']
WHERE name ILIKE '%Cold%' AND category = 'water';

-- Kapalbhati
UPDATE exercises SET 
  history = 'Skull-shining breath from Hatha Yoga, a purification technique.',
  benefits = ARRAY['Purifies lungs', 'Energizes body', 'Clears mind']
WHERE name ILIKE '%Kapalbhati%';

-- Bhastrika
UPDATE exercises SET 
  history = 'Bellows breath from ancient Yoga tradition for energy.',
  benefits = ARRAY['Increases vitality', 'Warms body', 'Improves digestion']
WHERE name ILIKE '%Bhastrika%';

-- Lion''s Breath
UPDATE exercises SET 
  history = 'Simhasana from Yoga, releases tension through fierce exhale.',
  benefits = ARRAY['Releases tension', 'Stimulates throat', 'Boosts confidence']
WHERE name ILIKE '%Lion%Breath%';

-- Qigong
UPDATE exercises SET 
  history = 'Core Qigong practice focusing on the energy center below navel.',
  benefits = ARRAY['Centers energy', 'Grounds mind', 'Builds chi']
WHERE name ILIKE '%Qigong%';

-- Tai Chi Standing
UPDATE exercises SET 
  history = 'Zhan Zhuang - Standing like a tree, ancient Taoist practice.',
  benefits = ARRAY['Builds strength', 'Improves balance', 'Cultivates stillness']
WHERE name ILIKE '%Tai Chi%';

-- Reverse Breathing
UPDATE exercises SET 
  history = 'Taoist technique where abdomen contracts on inhale.',
  benefits = ARRAY['Strengthens core', 'Builds internal power', 'Increases focus']
WHERE name ILIKE '%Reverse%';

-- Turtle Breathing
UPDATE exercises SET 
  history = 'Ancient Taoist practice for longevity, inspired by turtle''s slow breath.',
  benefits = ARRAY['Promotes longevity', 'Deep relaxation', 'Slows metabolism']
WHERE name ILIKE '%Turtle%';

-- Zazen
UPDATE exercises SET 
  history = 'Zen meditation breathing, foundation of Zazen practice.',
  benefits = ARRAY['Enhances presence', 'Quiets mind', 'Deepens awareness']
WHERE name ILIKE '%Zazen%';

-- Hara Breathing
UPDATE exercises SET 
  history = 'Breathing into the hara (belly center) in martial arts.',
  benefits = ARRAY['Builds power', 'Improves balance', 'Increases stability']
WHERE name ILIKE '%Hara%';

-- Nine-Round
UPDATE exercises SET 
  history = 'Buddhist practice to purify negative energies through 9 breaths.',
  benefits = ARRAY['Purifies negativity', 'Clears obstacles', 'Balances winds']
WHERE name ILIKE '%Nine%Round%';

-- Tummo
UPDATE exercises SET 
  history = 'Inner fire meditation from Tibetan Buddhism for generating heat.',
  benefits = ARRAY['Generates heat', 'Burns negativity', 'Awakens energy']
WHERE name ILIKE '%Tummo%';

-- Vase Breathing
UPDATE exercises SET 
  history = 'Holding breath in the belly like a vase, used in Tibetan Yoga.',
  benefits = ARRAY['Holds prana', 'Awakens kundalini', 'Deepens meditation']
WHERE name ILIKE '%Vase%';

-- Heart Breath
UPDATE exercises SET 
  history = 'Sufi practice focusing breath on the heart center.',
  benefits = ARRAY['Opens heart', 'Connects to divine', 'Cultivates love']
WHERE name ILIKE '%Heart Breath%';

-- Ha Breath
UPDATE exercises SET 
  history = 'Hawaiian breath of life, sacred in Huna tradition.',
  benefits = ARRAY['Connects to mana', 'Energizes body', 'Clears negativity']
WHERE name ILIKE '%Ha Breath%';

-- Buteyko
UPDATE exercises SET 
  history = 'Developed by Dr. Buteyko for asthma and nasal breathing.',
  benefits = ARRAY['Improves asthma', 'Nasal breathing', 'Reduces overbreathing']
WHERE name ILIKE '%Buteyko%';

-- Wim Hof
UPDATE exercises SET 
  history = 'Created by Wim Hof combining breathing, cold, and commitment.',
  benefits = ARRAY['Boosts immunity', 'Increases energy', 'Mental clarity']
WHERE name ILIKE '%Wim Hof%';

-- Holotropic
UPDATE exercises SET 
  history = 'Created by Stanislav Grof for accessing altered states.',
  benefits = ARRAY['Emotional release', 'Self-discovery', 'Healing trauma']
WHERE name ILIKE '%Holotropic%';

-- Resonant / Coherent Breathing
UPDATE exercises SET 
  history = 'Breathing at 5.5 breaths/min for optimal HRV and coherence.',
  benefits = ARRAY['Optimizes HRV', 'Heart coherence', 'Reduces anxiety']
WHERE name ILIKE '%Resonant%' OR name ILIKE '%Coherent%';

-- Diaphragmatic
UPDATE exercises SET 
  history = 'Foundation of all breathing practices, natural deep breathing.',
  benefits = ARRAY['Reduces stress', 'Improves oxygenation', 'Strengthens diaphragm']
WHERE name ILIKE '%Diaphragmatic%';

-- Default for any without history
UPDATE exercises SET 
  history = 'A time-tested breathing technique for wellness.',
  benefits = ARRAY['Reduces stress', 'Improves focus', 'Enhances wellbeing']
WHERE history IS NULL;
