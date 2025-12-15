-- ============================================
-- Add quick 1-2 minute exercises
-- ============================================

INSERT INTO exercises (name, description, category, level, duration_minutes, audio_preset, instructions, safety_warning) VALUES
-- Quick Breathing
(
  'Quick Calm',
  'A 1-minute breathing reset to instantly reduce stress. Perfect for busy moments.',
  'breathing',
  'beginner',
  1,
  'binaural_alpha',
  '[
    {"step": 1, "instruction": "Close your eyes and take a deep breath."},
    {"step": 2, "instruction": "Breathe in for 4 counts, out for 6 counts."},
    {"step": 3, "instruction": "Focus only on your breath."},
    {"step": 4, "instruction": "Continue until the session ends."}
  ]'::jsonb,
  NULL
),
(
  'Stress Buster',
  'Fast-acting breathing technique to lower cortisol in 2 minutes.',
  'breathing',
  'beginner',
  2,
  'binaural_alpha',
  '[
    {"step": 1, "instruction": "Sit or stand comfortably."},
    {"step": 2, "instruction": "Take 3 quick breaths in through nose."},
    {"step": 3, "instruction": "One long exhale through mouth."},
    {"step": 4, "instruction": "Repeat for the duration."}
  ]'::jsonb,
  NULL
),
(
  'Physiological Sigh',
  'The fastest way to calm down - discovered by Stanford researchers.',
  'breathing',
  'beginner',
  1,
  'silence',
  '[
    {"step": 1, "instruction": "Take a deep breath in."},
    {"step": 2, "instruction": "At the top, sneak in a second smaller breath."},
    {"step": 3, "instruction": "Slowly exhale all the air out."},
    {"step": 4, "instruction": "Repeat 3-5 times."}
  ]'::jsonb,
  NULL
),
-- Quick Sensory
(
  'Grounding Moment',
  'Quick sensory awareness exercise to bring you back to the present.',
  'sensory',
  'beginner',
  1,
  'om',
  '[
    {"step": 1, "instruction": "Notice 5 things you can see."},
    {"step": 2, "instruction": "Notice 4 things you can touch."},
    {"step": 3, "instruction": "Notice 3 things you can hear."},
    {"step": 4, "instruction": "Take 2 deep breaths."},
    {"step": 5, "instruction": "Name 1 thing you are grateful for."}
  ]'::jsonb,
  NULL
),
-- Quick Movement
(
  'Neck Release',
  'Quick tension release for neck and shoulders - perfect for desk workers.',
  'movement',
  'beginner',
  2,
  'solfeggio_432',
  '[
    {"step": 1, "instruction": "Drop your chin to chest, hold 10 seconds."},
    {"step": 2, "instruction": "Slowly roll head to right shoulder."},
    {"step": 3, "instruction": "Hold 10 seconds, feeling the stretch."},
    {"step": 4, "instruction": "Roll to left shoulder, hold 10 seconds."},
    {"step": 5, "instruction": "Return to center. Repeat if time allows."}
  ]'::jsonb,
  'Stop if you feel pain or dizziness.'
),
(
  'Vagal Massage',
  'Self-massage technique to stimulate the vagus nerve.',
  'movement',
  'beginner',
  2,
  'solfeggio_528',
  '[
    {"step": 1, "instruction": "Place two fingers behind your earlobes."},
    {"step": 2, "instruction": "Gently massage in circular motions."},
    {"step": 3, "instruction": "Move down along your neck slowly."},
    {"step": 4, "instruction": "Continue for the duration with gentle pressure."}
  ]'::jsonb,
  NULL
);
