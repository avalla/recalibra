-- ============================================
-- Additional Exercises - More Traditions
-- ============================================

-- ============================================
-- INDIAN PRANAYAMA (Missing ones)
-- ============================================

INSERT INTO exercises (name, description, category, level, duration_minutes, instructions, safety_warning, audio_preset, origin, is_premium) VALUES
(
  'Bhastrika',
  'Bellows Breath. A powerful energizing technique using rapid forceful inhales and exhales.',
  'breathing',
  'advanced',
  5,
  '[
    {"step": 1, "instruction": "Sit comfortably with spine straight."},
    {"step": 2, "instruction": "Take a deep breath in and exhale completely."},
    {"step": 3, "instruction": "Begin rapid, forceful breathing through both nostrils."},
    {"step": 4, "instruction": "Both inhale and exhale are active and equal in force."},
    {"step": 5, "instruction": "Do 20-30 breaths, then take a deep breath and hold briefly."},
    {"step": 6, "instruction": "Exhale slowly. Rest and repeat 2-3 rounds."}
  ]'::jsonb,
  'Avoid if pregnant, have high blood pressure, heart disease, or during menstruation. Stop if dizzy.',
  'binaural_alpha',
  'india',
  true
),
(
  'Nadi Shodhana',
  'Channel Purification Breath. Alternate nostril breathing for balance and mental clarity.',
  'breathing',
  'intermediate',
  10,
  '[
    {"step": 1, "instruction": "Sit comfortably with spine straight."},
    {"step": 2, "instruction": "Use right thumb to close right nostril."},
    {"step": 3, "instruction": "Inhale slowly through left nostril for 4 counts."},
    {"step": 4, "instruction": "Close left nostril with ring finger, hold for 4 counts."},
    {"step": 5, "instruction": "Release right nostril, exhale for 4 counts."},
    {"step": 6, "instruction": "Inhale right, hold, exhale left. This is one round."},
    {"step": 7, "instruction": "Continue for 5-10 rounds."}
  ]'::jsonb,
  'Avoid if you have a cold or nasal congestion.',
  'om',
  'india',
  true
);

-- ============================================
-- CHINESE QIGONG (Missing ones)
-- ============================================

INSERT INTO exercises (name, description, category, level, duration_minutes, instructions, safety_warning, audio_preset, origin, is_premium) VALUES
(
  'Reverse Breathing',
  'Taoist technique where the abdomen contracts on inhale. Builds internal power and focus.',
  'breathing',
  'advanced',
  10,
  '[
    {"step": 1, "instruction": "Sit or stand in a relaxed posture."},
    {"step": 2, "instruction": "Place one hand on your belly to feel the movement."},
    {"step": 3, "instruction": "As you inhale, gently draw your belly IN toward spine."},
    {"step": 4, "instruction": "As you exhale, let your belly expand OUT."},
    {"step": 5, "instruction": "This is the reverse of natural breathing."},
    {"step": 6, "instruction": "Practice slowly, 10-15 breaths. It takes time to master."}
  ]'::jsonb,
  'Advanced practice. Master natural breathing first. Stop if uncomfortable.',
  'schumann',
  'china',
  true
),
(
  'Turtle Breathing',
  'Ancient Taoist longevity practice. Extremely slow breaths inspired by the turtle''s lifespan.',
  'breathing',
  'advanced',
  15,
  '[
    {"step": 1, "instruction": "Sit in deep meditation posture, completely relaxed."},
    {"step": 2, "instruction": "Begin with normal breaths, gradually slowing them down."},
    {"step": 3, "instruction": "Aim for breaths so slow they are almost imperceptible."},
    {"step": 4, "instruction": "Inhale for 15-30 seconds or more."},
    {"step": 5, "instruction": "Exhale equally slowly, with no pause between."},
    {"step": 6, "instruction": "Let the breath become thread-like, almost stopping."}
  ]'::jsonb,
  'Very advanced practice. Only attempt after years of breath training.',
  'binaural_delta',
  'china',
  true
);

-- ============================================
-- TIBETAN (Missing ones)
-- ============================================

INSERT INTO exercises (name, description, category, level, duration_minutes, instructions, safety_warning, audio_preset, origin, is_premium) VALUES
(
  'Vase Breathing',
  'Kumbhaka practice. Holding breath in the belly like a vase to retain prana and deepen meditation.',
  'breathing',
  'advanced',
  10,
  '[
    {"step": 1, "instruction": "Sit in meditation posture with straight spine."},
    {"step": 2, "instruction": "Inhale deeply, drawing breath down to your belly."},
    {"step": 3, "instruction": "Swallow gently and press down, sealing the breath."},
    {"step": 4, "instruction": "Hold the breath in your lower belly like water in a vase."},
    {"step": 5, "instruction": "When you need to exhale, release slowly through the nose."},
    {"step": 6, "instruction": "Rest and repeat. Start with short holds, increase gradually."}
  ]'::jsonb,
  'Advanced practice. Learn from qualified teacher. Do not strain.',
  'tibetan_bowl',
  'tibet',
  true
);

-- ============================================
-- MODERN WESTERN TECHNIQUES
-- ============================================

INSERT INTO exercises (name, description, category, level, duration_minutes, instructions, safety_warning, audio_preset, origin, is_premium) VALUES
(
  'Buteyko Method',
  'Developed by Dr. Buteyko. Focuses on nasal breathing and reducing over-breathing.',
  'breathing',
  'intermediate',
  10,
  '[
    {"step": 1, "instruction": "Sit comfortably and relax your body."},
    {"step": 2, "instruction": "Close your mouth and breathe only through your nose."},
    {"step": 3, "instruction": "Take a normal breath in and a normal breath out."},
    {"step": 4, "instruction": "Pinch your nose and hold your breath."},
    {"step": 5, "instruction": "When you feel the first urge to breathe, release and breathe normally."},
    {"step": 6, "instruction": "Wait 30 seconds. Repeat, trying to extend the comfortable hold."}
  ]'::jsonb,
  'Do not push past mild discomfort. Not suitable during asthma attacks.',
  'silence',
  'usa',
  true
),
(
  'Wim Hof Method',
  'The Ice Man technique. Combines deep breathing, breath holds, and cold exposure.',
  'breathing',
  'advanced',
  15,
  '[
    {"step": 1, "instruction": "Lie down or sit comfortably in a safe place."},
    {"step": 2, "instruction": "Take 30-40 deep, powerful breaths: full inhale, relaxed exhale."},
    {"step": 3, "instruction": "On the last exhale, hold your breath with lungs empty."},
    {"step": 4, "instruction": "Hold as long as comfortable (1-3 minutes is normal)."},
    {"step": 5, "instruction": "When you need to breathe, take one deep breath and hold 15 seconds."},
    {"step": 6, "instruction": "Exhale and repeat 3-4 rounds. Optional: follow with cold exposure."}
  ]'::jsonb,
  'Never practice in water or while driving. May cause lightheadedness. Lie down for safety.',
  'nature_ocean',
  'usa',
  true
),
(
  'Holotropic Breathwork',
  'Created by Stanislav Grof. Intensive breathing for accessing non-ordinary states of consciousness.',
  'breathing',
  'advanced',
  30,
  '[
    {"step": 1, "instruction": "Lie down in a safe, comfortable space with a sitter present."},
    {"step": 2, "instruction": "Begin breathing faster and deeper than normal, with no pauses."},
    {"step": 3, "instruction": "Maintain continuous circular breathing: inhale flows into exhale."},
    {"step": 4, "instruction": "Allow any emotions, sensations, or movements to arise."},
    {"step": 5, "instruction": "Continue for 30-60 minutes with evocative music."},
    {"step": 6, "instruction": "Gradually slow breathing and rest. Integration is important."}
  ]'::jsonb,
  'Only practice with trained facilitator. Not for pregnancy, heart conditions, epilepsy, or mental illness.',
  'binaural_theta',
  'usa',
  true
);
