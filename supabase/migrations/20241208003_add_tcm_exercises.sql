-- ============================================
-- Traditional Chinese Medicine inspired exercises
-- ============================================

INSERT INTO exercises (name, description, category, level, duration_minutes, audio_preset, instructions, safety_warning) VALUES
-- Qigong / Breathing
(
  'Dan Tian Breathing',
  'Ancient Chinese breathing technique focusing on the lower abdomen energy center. Calms the mind and strengthens Qi.',
  'breathing',
  'beginner',
  5,
  'solfeggio_432',
  '[
    {"step": 1, "instruction": "Sit or stand with spine straight, shoulders relaxed."},
    {"step": 2, "instruction": "Place hands on lower belly, 2 inches below navel (Dan Tian)."},
    {"step": 3, "instruction": "Breathe in slowly through nose, expanding the belly."},
    {"step": 4, "instruction": "Feel the breath fill your Dan Tian energy center."},
    {"step": 5, "instruction": "Exhale slowly, gently contracting the belly."},
    {"step": 6, "instruction": "Visualize warm golden light in your center."}
  ]'::jsonb,
  NULL
),
(
  'Kidney Breathing',
  'TCM practice to nourish Kidney Qi and reduce fear and anxiety. Supports adrenal health.',
  'breathing',
  'intermediate',
  7,
  'binaural_theta',
  '[
    {"step": 1, "instruction": "Sit comfortably, place hands on lower back over kidneys."},
    {"step": 2, "instruction": "Breathe in, visualize energy flowing to your kidneys."},
    {"step": 3, "instruction": "Hold briefly, feel warmth in lower back."},
    {"step": 4, "instruction": "Exhale slowly, releasing fear and tension."},
    {"step": 5, "instruction": "Repeat, building warmth and vitality."}
  ]'::jsonb,
  NULL
),
-- Acupressure Points
(
  'Heart 7 - Shen Men',
  'Acupressure on the "Spirit Gate" point. Calms the heart, reduces anxiety, and promotes peaceful sleep.',
  'sensory',
  'beginner',
  3,
  'om',
  '[
    {"step": 1, "instruction": "Find the crease on the inside of your wrist."},
    {"step": 2, "instruction": "Locate the point on the pinky side of the crease."},
    {"step": 3, "instruction": "Press gently with thumb, hold for 30 seconds."},
    {"step": 4, "instruction": "Breathe deeply while pressing."},
    {"step": 5, "instruction": "Switch to other wrist and repeat."},
    {"step": 6, "instruction": "Do 3 rounds on each wrist."}
  ]'::jsonb,
  NULL
),
(
  'Pericardium 6 - Nei Guan',
  'The "Inner Gate" point relieves nausea, anxiety, and calms the heart. Used for motion sickness too.',
  'sensory',
  'beginner',
  2,
  'silence',
  '[
    {"step": 1, "instruction": "Place 3 fingers above wrist crease on inner arm."},
    {"step": 2, "instruction": "Find the point between the two tendons."},
    {"step": 3, "instruction": "Press firmly but gently with thumb."},
    {"step": 4, "instruction": "Hold for 1 minute while breathing slowly."},
    {"step": 5, "instruction": "Release and repeat on other arm."}
  ]'::jsonb,
  'Avoid during pregnancy without consulting practitioner.'
),
(
  'Yin Tang - Third Eye',
  'Pressing this point between eyebrows calms the mind and relieves headaches and stress.',
  'sensory',
  'beginner',
  2,
  'binaural_alpha',
  '[
    {"step": 1, "instruction": "Find the point between your eyebrows."},
    {"step": 2, "instruction": "Use index finger or thumb to apply gentle pressure."},
    {"step": 3, "instruction": "Close your eyes and breathe slowly."},
    {"step": 4, "instruction": "Hold for 1-2 minutes."},
    {"step": 5, "instruction": "Release slowly and notice the calm."}
  ]'::jsonb,
  NULL
),
-- Qigong Movements
(
  'Lifting the Sky',
  'Simple Qigong exercise to open the chest, improve posture, and circulate Qi throughout the body.',
  'movement',
  'beginner',
  3,
  'solfeggio_528',
  '[
    {"step": 1, "instruction": "Stand with feet shoulder-width apart."},
    {"step": 2, "instruction": "Interlace fingers, palms facing down in front of you."},
    {"step": 3, "instruction": "Inhale, raise arms overhead, palms facing up."},
    {"step": 4, "instruction": "Gently push palms toward sky, stretch upward."},
    {"step": 5, "instruction": "Exhale, lower arms slowly to sides."},
    {"step": 6, "instruction": "Repeat 8-10 times with slow breaths."}
  ]'::jsonb,
  NULL
),
(
  'Shaking Qigong',
  'Vibration practice to release tension, move stagnant energy, and activate the nervous system reset.',
  'movement',
  'beginner',
  2,
  'silence',
  '[
    {"step": 1, "instruction": "Stand with feet shoulder-width, knees slightly bent."},
    {"step": 2, "instruction": "Begin gently bouncing on your heels."},
    {"step": 3, "instruction": "Let the vibration move through your whole body."},
    {"step": 4, "instruction": "Relax shoulders, jaw, and let arms shake loosely."},
    {"step": 5, "instruction": "Continue for 2 minutes, breathing naturally."},
    {"step": 6, "instruction": "Stop and stand still, feeling the energy flow."}
  ]'::jsonb,
  'Stop if you feel dizzy. Not recommended if you have joint issues.'
),
(
  'Five Element Breathing',
  'Cycle through the five elements of TCM to balance all organ systems and emotions.',
  'breathing',
  'intermediate',
  10,
  'nature_ocean',
  '[
    {"step": 1, "instruction": "Wood (Liver): Breathe green, release anger. 5 breaths."},
    {"step": 2, "instruction": "Fire (Heart): Breathe red, cultivate joy. 5 breaths."},
    {"step": 3, "instruction": "Earth (Spleen): Breathe yellow, find stability. 5 breaths."},
    {"step": 4, "instruction": "Metal (Lungs): Breathe white, let go of grief. 5 breaths."},
    {"step": 5, "instruction": "Water (Kidneys): Breathe blue, release fear. 5 breaths."},
    {"step": 6, "instruction": "Repeat the full cycle 2-3 times."}
  ]'::jsonb,
  NULL
);
