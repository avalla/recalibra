-- ============================================
-- Additional Exercises from World Cultures
-- ============================================

-- ============================================
-- INDIAN/YOGIC BREATHING (Pranayama)
-- ============================================

INSERT INTO exercises (name, description, category, level, duration_minutes, instructions, safety_warning, audio_preset) VALUES
(
  'Ujjayi Breathing',
  'The victorious breath from yoga tradition. Creates a soft oceanic sound by gently constricting the throat.',
  'breathing',
  'intermediate',
  10,
  '[
    {"step": 1, "instruction": "Sit comfortably with spine straight and shoulders relaxed."},
    {"step": 2, "instruction": "Slightly constrict the back of your throat, as if fogging a mirror."},
    {"step": 3, "instruction": "Breathe in slowly through your nose, creating a soft hissing sound."},
    {"step": 4, "instruction": "Exhale through your nose with the same gentle constriction."},
    {"step": 5, "instruction": "The breath should sound like ocean waves or a gentle snore."},
    {"step": 6, "instruction": "Keep the breath slow, smooth, and rhythmic throughout."}
  ]'::jsonb,
  'Start gently. If you feel strain in your throat, relax the constriction.',
  'nature_ocean'
),
(
  'Kapalbhati',
  'Skull Shining Breath. A powerful cleansing technique using rapid, forceful exhales.',
  'breathing',
  'advanced',
  5,
  '[
    {"step": 1, "instruction": "Sit with spine straight, hands on knees."},
    {"step": 2, "instruction": "Take a deep breath in to prepare."},
    {"step": 3, "instruction": "Exhale forcefully through your nose, pulling your navel toward spine."},
    {"step": 4, "instruction": "Let the inhale happen passively as your belly relaxes."},
    {"step": 5, "instruction": "Start with 20 rapid exhales, then rest with normal breathing."},
    {"step": 6, "instruction": "Gradually increase to 60-100 exhales per round."}
  ]'::jsonb,
  'Avoid during pregnancy, menstruation, high blood pressure, or heart conditions. Stop if dizzy.',
  'binaural_alpha'
),
(
  'Bhramari',
  'Bee Breath. The humming vibration calms the mind and activates the vagus nerve deeply.',
  'breathing',
  'beginner',
  5,
  '[
    {"step": 1, "instruction": "Sit comfortably and close your eyes."},
    {"step": 2, "instruction": "Place your index fingers gently on the cartilage of your ears."},
    {"step": 3, "instruction": "Take a deep breath in through your nose."},
    {"step": 4, "instruction": "As you exhale, make a humming sound like a bee (mmmmm)."},
    {"step": 5, "instruction": "Feel the vibration in your head, face, and chest."},
    {"step": 6, "instruction": "Continue for 5-10 rounds, breathing naturally between hums."}
  ]'::jsonb,
  NULL,
  'tibetan_bowl'
),
(
  'Sitali Pranayama',
  'Cooling Breath. Roll your tongue and breathe to cool the body and calm emotions.',
  'breathing',
  'beginner',
  5,
  '[
    {"step": 1, "instruction": "Sit comfortably with eyes closed."},
    {"step": 2, "instruction": "Roll your tongue into a tube shape (or purse lips if unable)."},
    {"step": 3, "instruction": "Inhale slowly through your rolled tongue, feeling cool air."},
    {"step": 4, "instruction": "Close your mouth and exhale through your nose."},
    {"step": 5, "instruction": "Notice the cooling sensation on your tongue and throat."},
    {"step": 6, "instruction": "Repeat for 10-15 breaths."}
  ]'::jsonb,
  'Avoid in cold weather or if you have asthma or respiratory infections.',
  'wind'
);

-- ============================================
-- CHINESE/TAOIST PRACTICES
-- ============================================

INSERT INTO exercises (name, description, category, level, duration_minutes, instructions, safety_warning, audio_preset) VALUES
(
  'Qigong Breathing',
  'Ancient Chinese practice combining breath, movement, and energy visualization for healing.',
  'breathing',
  'intermediate',
  15,
  '[
    {"step": 1, "instruction": "Stand with feet shoulder-width apart, knees slightly bent."},
    {"step": 2, "instruction": "Place your hands on your lower belly (dantian)."},
    {"step": 3, "instruction": "Breathe deeply into your belly, feeling it expand under your hands."},
    {"step": 4, "instruction": "As you inhale, visualize gathering energy from the earth."},
    {"step": 5, "instruction": "As you exhale, imagine releasing tension and stagnant energy."},
    {"step": 6, "instruction": "Continue with slow, deep breaths, feeling rooted and calm."}
  ]'::jsonb,
  NULL,
  'schumann'
),
(
  'Tai Chi Standing',
  'Zhan Zhuang - Standing like a tree. A meditation practice for grounding and inner stillness.',
  'movement',
  'intermediate',
  10,
  '[
    {"step": 1, "instruction": "Stand with feet shoulder-width apart, toes slightly inward."},
    {"step": 2, "instruction": "Bend knees slightly, as if sitting on a high stool."},
    {"step": 3, "instruction": "Raise your arms as if hugging a large tree in front of you."},
    {"step": 4, "instruction": "Relax your shoulders, letting them drop away from ears."},
    {"step": 5, "instruction": "Breathe naturally, feeling your feet rooted to the ground."},
    {"step": 6, "instruction": "Hold this position, allowing any sensations to arise and pass."}
  ]'::jsonb,
  'Start with 2-3 minutes and gradually increase. Stop if your legs tremble excessively.',
  'nature_forest'
);

-- ============================================
-- JAPANESE ZEN PRACTICES
-- ============================================

INSERT INTO exercises (name, description, category, level, duration_minutes, instructions, safety_warning, audio_preset) VALUES
(
  'Zazen Breath Counting',
  'Traditional Zen meditation technique. Count breaths to anchor the wandering mind.',
  'breathing',
  'beginner',
  15,
  '[
    {"step": 1, "instruction": "Sit in a comfortable, stable position with spine straight."},
    {"step": 2, "instruction": "Lower your gaze to a point about 3 feet ahead, eyes half-closed."},
    {"step": 3, "instruction": "Breathe naturally through your nose."},
    {"step": 4, "instruction": "Count each exhale: 1, 2, 3... up to 10."},
    {"step": 5, "instruction": "When you reach 10, start again from 1."},
    {"step": 6, "instruction": "If you lose count, gently return to 1 without judgment."}
  ]'::jsonb,
  NULL,
  'silence'
),
(
  'Hara Breathing',
  'Japanese practice focusing on the body''s center of gravity, 3 fingers below the navel.',
  'breathing',
  'intermediate',
  10,
  '[
    {"step": 1, "instruction": "Sit in seiza (kneeling) or cross-legged position."},
    {"step": 2, "instruction": "Place your attention on your hara, 3 fingers below your navel."},
    {"step": 3, "instruction": "Breathe deeply, directing each breath to your hara."},
    {"step": 4, "instruction": "Feel your lower belly expand on inhale, contract on exhale."},
    {"step": 5, "instruction": "Imagine your hara as your center of power and stability."},
    {"step": 6, "instruction": "Continue breathing into this center, feeling grounded."}
  ]'::jsonb,
  NULL,
  'om'
);

-- ============================================
-- TIBETAN PRACTICES
-- ============================================

INSERT INTO exercises (name, description, category, level, duration_minutes, instructions, safety_warning, audio_preset) VALUES
(
  'Nine-Round Breathing',
  'Tibetan Buddhist purification practice to clear energy channels and calm the mind.',
  'breathing',
  'intermediate',
  10,
  '[
    {"step": 1, "instruction": "Sit comfortably with spine straight and hands on thighs."},
    {"step": 2, "instruction": "First 3 breaths: Block right nostril, inhale left, exhale right."},
    {"step": 3, "instruction": "Next 3 breaths: Block left nostril, inhale right, exhale left."},
    {"step": 4, "instruction": "Last 3 breaths: Breathe through both nostrils equally."},
    {"step": 5, "instruction": "With each exhale, visualize releasing negativity and obstacles."},
    {"step": 6, "instruction": "Repeat the full cycle of 9 breaths 2-3 times."}
  ]'::jsonb,
  NULL,
  'tibetan_bells'
),
(
  'Tummo Breathing',
  'Inner Fire meditation. Advanced Tibetan technique for generating inner heat and energy.',
  'breathing',
  'advanced',
  15,
  '[
    {"step": 1, "instruction": "Sit in a comfortable meditative posture."},
    {"step": 2, "instruction": "Visualize a small flame at your navel center."},
    {"step": 3, "instruction": "Inhale deeply, drawing energy down to the flame."},
    {"step": 4, "instruction": "Hold the breath and visualize the flame growing brighter."},
    {"step": 5, "instruction": "Exhale slowly, feeling warmth spreading through your body."},
    {"step": 6, "instruction": "Continue, gradually building the sensation of inner heat."}
  ]'::jsonb,
  'This is an advanced practice. Learn from a qualified teacher. Stop if uncomfortable.',
  'solfeggio_528'
);

-- ============================================
-- SUFI/MIDDLE EASTERN PRACTICES
-- ============================================

INSERT INTO exercises (name, description, category, level, duration_minutes, instructions, safety_warning, audio_preset) VALUES
(
  'Heart Breath',
  'Sufi meditation focusing on the spiritual heart. Cultivates love and divine connection.',
  'breathing',
  'beginner',
  10,
  '[
    {"step": 1, "instruction": "Sit comfortably and place your right hand over your heart."},
    {"step": 2, "instruction": "Close your eyes and bring attention to your heart center."},
    {"step": 3, "instruction": "Breathe slowly, imagining breath flowing in and out of your heart."},
    {"step": 4, "instruction": "With each inhale, breathe in love and peace."},
    {"step": 5, "instruction": "With each exhale, release any heaviness or worry."},
    {"step": 6, "instruction": "Feel your heart expanding with each breath cycle."}
  ]'::jsonb,
  NULL,
  'solfeggio_639'
);

-- ============================================
-- HAWAIIAN PRACTICES
-- ============================================

INSERT INTO exercises (name, description, category, level, duration_minutes, instructions, safety_warning, audio_preset) VALUES
(
  'Ha Breath',
  'Sacred Hawaiian breath of life. ''Ha'' means breath and life force in Hawaiian.',
  'breathing',
  'beginner',
  5,
  '[
    {"step": 1, "instruction": "Stand or sit with your feet connected to the earth."},
    {"step": 2, "instruction": "Take a deep breath in through your nose."},
    {"step": 3, "instruction": "Exhale forcefully through your mouth with the sound ''HA!''."},
    {"step": 4, "instruction": "Feel the release of tension with each powerful exhale."},
    {"step": 5, "instruction": "Repeat 7-10 times, building energy with each breath."},
    {"step": 6, "instruction": "End with a few natural breaths, feeling revitalized."}
  ]'::jsonb,
  NULL,
  'nature_ocean'
);

-- ============================================
-- MODERN WESTERN TECHNIQUES
-- ============================================

INSERT INTO exercises (name, description, category, level, duration_minutes, instructions, safety_warning, audio_preset) VALUES
(
  'Wim Hof Breathing',
  'Powerful breathing method for energy, focus, and stress resilience. Created by ''The Iceman''.',
  'breathing',
  'advanced',
  10,
  '[
    {"step": 1, "instruction": "Lie down or sit comfortably in a safe place."},
    {"step": 2, "instruction": "Take 30-40 deep breaths: inhale fully, exhale without forcing."},
    {"step": 3, "instruction": "On the last exhale, hold your breath with empty lungs."},
    {"step": 4, "instruction": "Hold as long as comfortable (1-3 minutes)."},
    {"step": 5, "instruction": "When you need to breathe, inhale fully and hold for 15 seconds."},
    {"step": 6, "instruction": "Exhale and repeat the cycle 3-4 times."}
  ]'::jsonb,
  'Never practice in water or while driving. Lie down in a safe place. Tingling is normal; stop if uncomfortable.',
  'binaural_alpha'
),
(
  'Physiological Sigh',
  'The fastest way to calm down in real-time. Discovered by Stanford neuroscientist Andrew Huberman.',
  'breathing',
  'beginner',
  2,
  '[
    {"step": 1, "instruction": "This can be done anywhere, anytime you feel stressed."},
    {"step": 2, "instruction": "Inhale deeply through your nose."},
    {"step": 3, "instruction": "At the top, take a second quick inhale to fully fill your lungs."},
    {"step": 4, "instruction": "Exhale slowly and completely through your mouth."},
    {"step": 5, "instruction": "The double inhale reopens collapsed air sacs in your lungs."},
    {"step": 6, "instruction": "Repeat 1-3 times for immediate calm."}
  ]'::jsonb,
  NULL,
  'silence'
),
(
  'Coherent Breathing',
  'Breathe at 5 breaths per minute to synchronize heart, brain, and nervous system.',
  'breathing',
  'beginner',
  10,
  '[
    {"step": 1, "instruction": "Sit comfortably and relax your body."},
    {"step": 2, "instruction": "Inhale slowly for 6 seconds."},
    {"step": 3, "instruction": "Exhale slowly for 6 seconds."},
    {"step": 4, "instruction": "There is no pause between inhale and exhale."},
    {"step": 5, "instruction": "Continue this smooth, even rhythm."},
    {"step": 6, "instruction": "This rate creates optimal heart rate variability."}
  ]'::jsonb,
  NULL,
  'solfeggio_432'
);

-- ============================================
-- ADDITIONAL SENSORY/MOVEMENT EXERCISES
-- ============================================

INSERT INTO exercises (name, description, category, level, duration_minutes, instructions, safety_warning, audio_preset) VALUES
(
  'Ear Massage',
  'Stimulate vagus nerve branches in the ear through gentle massage.',
  'sensory',
  'beginner',
  5,
  '[
    {"step": 1, "instruction": "Sit comfortably and take a few deep breaths."},
    {"step": 2, "instruction": "Gently massage your earlobes between thumb and forefinger."},
    {"step": 3, "instruction": "Move up along the outer edge of your ear, massaging gently."},
    {"step": 4, "instruction": "Press gently into the hollow behind your earlobe."},
    {"step": 5, "instruction": "Massage the inner folds of your ear with light pressure."},
    {"step": 6, "instruction": "Finish by gently pulling your earlobes downward 3 times."}
  ]'::jsonb,
  NULL,
  'nature_rain'
),
(
  'Lion''s Breath',
  'A playful yoga breath that releases tension in face and throat while activating the vagus nerve.',
  'breathing',
  'beginner',
  3,
  '[
    {"step": 1, "instruction": "Sit comfortably or kneel on the floor."},
    {"step": 2, "instruction": "Take a deep breath in through your nose."},
    {"step": 3, "instruction": "Open your mouth wide, stick out your tongue toward your chin."},
    {"step": 4, "instruction": "Exhale forcefully with a ''HA'' sound, like a lion roaring."},
    {"step": 5, "instruction": "Widen your eyes and look upward during the exhale."},
    {"step": 6, "instruction": "Repeat 5-7 times. Let yourself be playful!"}
  ]'::jsonb,
  NULL,
  'silence'
),
(
  'Body Scan',
  'Progressive relaxation technique to release tension and activate the rest response.',
  'movement',
  'beginner',
  15,
  '[
    {"step": 1, "instruction": "Lie down comfortably on your back."},
    {"step": 2, "instruction": "Close your eyes and take 3 deep breaths."},
    {"step": 3, "instruction": "Bring attention to your feet. Notice any sensations, then relax them."},
    {"step": 4, "instruction": "Slowly move attention up: calves, thighs, hips, belly, chest."},
    {"step": 5, "instruction": "Continue to shoulders, arms, hands, neck, face, and head."},
    {"step": 6, "instruction": "Rest in full-body awareness for a few minutes."}
  ]'::jsonb,
  NULL,
  'binaural_delta'
);
