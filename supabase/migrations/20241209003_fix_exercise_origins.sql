-- Fix exercise origins with more flexible matching

-- USA / Modern (science-based)
UPDATE exercises SET origin = 'usa' WHERE name ILIKE '%Box Breathing%';
UPDATE exercises SET origin = 'usa' WHERE name ILIKE '%Physiological Sigh%';
UPDATE exercises SET origin = 'usa' WHERE name ILIKE '%Wim Hof%';
UPDATE exercises SET origin = 'usa' WHERE name ILIKE '%Coherent Breathing%';
UPDATE exercises SET origin = 'usa' WHERE name ILIKE '%4-7-8%';
UPDATE exercises SET origin = 'usa' WHERE name ILIKE '%Diaphragmatic%';
UPDATE exercises SET origin = 'usa' WHERE name ILIKE '%Resonant Breathing%';

-- India (Yoga/Pranayama)
UPDATE exercises SET origin = 'india' WHERE name ILIKE '%Alternate Nostril%';
UPDATE exercises SET origin = 'india' WHERE name ILIKE '%Ujjayi%';
UPDATE exercises SET origin = 'india' WHERE name ILIKE '%Kapalbhati%';
UPDATE exercises SET origin = 'india' WHERE name ILIKE '%Bhramari%';
UPDATE exercises SET origin = 'india' WHERE name ILIKE '%Sitali%';
UPDATE exercises SET origin = 'india' WHERE name ILIKE '%Lion%Breath%';
UPDATE exercises SET origin = 'india' WHERE name ILIKE '%Pranayama%';

-- China (Qigong/Tai Chi)
UPDATE exercises SET origin = 'china' WHERE name ILIKE '%Qigong%';
UPDATE exercises SET origin = 'china' WHERE name ILIKE '%Tai Chi%';

-- Japan (Zen)
UPDATE exercises SET origin = 'japan' WHERE name ILIKE '%Zazen%';
UPDATE exercises SET origin = 'japan' WHERE name ILIKE '%Hara%';

-- Tibet
UPDATE exercises SET origin = 'tibet' WHERE name ILIKE '%Humming%';
UPDATE exercises SET origin = 'tibet' WHERE name ILIKE '%OM Chanting%';
UPDATE exercises SET origin = 'tibet' WHERE name ILIKE '%Nine-Round%';
UPDATE exercises SET origin = 'tibet' WHERE name ILIKE '%Tummo%';
UPDATE exercises SET origin = 'tibet' WHERE name ILIKE '%Tibetan%';

-- Sufi
UPDATE exercises SET origin = 'sufi' WHERE name ILIKE '%Heart Breath%';

-- Hawaii
UPDATE exercises SET origin = 'hawaii' WHERE name ILIKE '%Ha Breath%';

-- Universal (general body practices)
UPDATE exercises SET origin = 'universal' WHERE name ILIKE '%Neck Stretch%';
UPDATE exercises SET origin = 'universal' WHERE name ILIKE '%Eye Yoga%';
UPDATE exercises SET origin = 'universal' WHERE name ILIKE '%Legs Up%';
UPDATE exercises SET origin = 'universal' WHERE name ILIKE '%Cold Exposure%';
UPDATE exercises SET origin = 'universal' WHERE name ILIKE '%Cold Water%';
UPDATE exercises SET origin = 'universal' WHERE name ILIKE '%Yawning%';
UPDATE exercises SET origin = 'universal' WHERE name ILIKE '%Gargling%';
UPDATE exercises SET origin = 'universal' WHERE name ILIKE '%Mindful Drinking%';
UPDATE exercises SET origin = 'universal' WHERE name ILIKE '%Ear Massage%';
UPDATE exercises SET origin = 'universal' WHERE name ILIKE '%Body Scan%';

-- Set remaining NULL origins to universal
UPDATE exercises SET origin = 'universal' WHERE origin IS NULL;
