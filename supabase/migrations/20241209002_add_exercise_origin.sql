-- Add origin/tradition field to exercises
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS origin TEXT;

-- Update existing exercises with their origins
UPDATE exercises SET origin = 'usa' WHERE name IN ('Box Breathing', 'Physiological Sigh', 'Wim Hof Breathing', 'Coherent Breathing');
UPDATE exercises SET origin = 'india' WHERE name IN ('4-7-8 Breathing', 'Diaphragmatic Breathing', 'Resonant Breathing', 'Alternate Nostril Breathing', 'Ujjayi Breathing', 'Kapalbhati', 'Bhramari', 'Sitali Pranayama', 'Lion''s Breath');
UPDATE exercises SET origin = 'china' WHERE name IN ('Qigong Breathing', 'Tai Chi Standing');
UPDATE exercises SET origin = 'japan' WHERE name IN ('Zazen Breath Counting', 'Hara Breathing', 'Cold Water Facial Immersion');
UPDATE exercises SET origin = 'tibet' WHERE name IN ('Humming / OM Chanting', 'Nine-Round Breathing', 'Tummo Breathing');
UPDATE exercises SET origin = 'sufi' WHERE name IN ('Heart Breath');
UPDATE exercises SET origin = 'hawaii' WHERE name IN ('Ha Breath');
UPDATE exercises SET origin = 'universal' WHERE name IN ('Neck Stretches', 'Eye Yoga', 'Legs Up The Wall', 'Cold Exposure', 'Voluntary Yawning', 'Gargling', 'Mindful Drinking', 'Ear Massage', 'Body Scan');
