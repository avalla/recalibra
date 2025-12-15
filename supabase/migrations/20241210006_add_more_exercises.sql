-- ============================================
-- Additional Exercises - Extended Collection
-- ============================================

-- ============================================
-- ADVANCED PRANAYAMA (India)
-- ============================================

INSERT INTO exercises (name, description, category, level, duration_minutes, instructions, safety_warning, audio_preset, origin, is_premium, history, benefits, tips, breathing_pattern) VALUES
(
  'Breath of Fire',
  'Kundalini breathing technique with rapid, rhythmic breaths powered by the diaphragm.',
  'breathing',
  'advanced',
  5,
  '[
    {"step": 1, "instruction": "Sit with spine straight, hands on knees."},
    {"step": 2, "instruction": "Take a deep breath to prepare."},
    {"step": 3, "instruction": "Begin rapid, equal inhales and exhales through the nose."},
    {"step": 4, "instruction": "Pump your belly: pull in on exhale, release on inhale."},
    {"step": 5, "instruction": "Keep chest relatively still, breath comes from diaphragm."},
    {"step": 6, "instruction": "Start with 1 minute, rest, then repeat."}
  ]'::jsonb,
  'Avoid during pregnancy, menstruation, high blood pressure. Stop if dizzy or lightheaded.',
  'binaural_alpha',
  'india',
  true,
  'Ancient Kundalini Yoga technique to awaken energy and cleanse the body.',
  ARRAY['Energizes body', 'Clears mind', 'Strengthens core', 'Detoxifies'],
  ARRAY['Start slow - 1 breath per second', 'Keep mouth closed', 'Focus on the navel pumping'],
  '{"inhale": 0.5, "hold": 0, "exhale": 0.5, "rest": 0, "special": "rapid", "cycles": 60}'::jsonb
),
(
  'Kumbhaka',
  'Extended breath retention practice to increase lung capacity and calm the mind.',
  'breathing',
  'advanced',
  10,
  '[
    {"step": 1, "instruction": "Sit comfortably with spine straight."},
    {"step": 2, "instruction": "Inhale deeply for 4 counts."},
    {"step": 3, "instruction": "Hold your breath (Kumbhaka) for 8-16 counts."},
    {"step": 4, "instruction": "Exhale slowly for 8 counts."},
    {"step": 5, "instruction": "Optional: hold empty for 4 counts."},
    {"step": 6, "instruction": "Repeat, gradually increasing retention time."}
  ]'::jsonb,
  'Do not strain. Build up retention time gradually over weeks. Stop if uncomfortable.',
  'om',
  'india',
  true,
  'Ancient yogic practice mentioned in Patanjali''s Yoga Sutras for mastering prana.',
  ARRAY['Increases lung capacity', 'Calms mind', 'Builds willpower', 'Balances energy'],
  ARRAY['Never force the retention', 'Increase by 1 second per week', 'Empty stomach is best'],
  '{"inhale": 4, "hold": 16, "exhale": 8, "rest": 4}'::jsonb
),
(
  'Viloma Pranayama',
  'Interrupted breathing - inhale or exhale in stages with pauses.',
  'breathing',
  'intermediate',
  10,
  '[
    {"step": 1, "instruction": "Lie down or sit comfortably."},
    {"step": 2, "instruction": "Inhale for 2 seconds, pause for 2 seconds."},
    {"step": 3, "instruction": "Inhale more for 2 seconds, pause again."},
    {"step": 4, "instruction": "Continue until lungs are full (3-4 stages)."},
    {"step": 5, "instruction": "Exhale smoothly and completely."},
    {"step": 6, "instruction": "Repeat 5-10 cycles. Can also do interrupted exhale."}
  ]'::jsonb,
  'Avoid if you have anxiety or panic disorder. Keep pauses gentle.',
  'nature_rain',
  'india',
  true,
  'Classical pranayama meaning ''against the grain'' - interrupting natural breath flow.',
  ARRAY['Expands lung capacity', 'Increases awareness', 'Calms nervous system'],
  ARRAY['Keep pauses soft, not tense', 'Can do interrupted inhale OR exhale', 'Great for anxiety'],
  '{"inhale": 2, "hold": 2, "exhale": 8, "rest": 0, "special": "viloma"}'::jsonb
),
(
  'Surya Bhedana',
  'Right nostril breathing to activate the solar/heating/energizing channel.',
  'breathing',
  'intermediate',
  10,
  '[
    {"step": 1, "instruction": "Sit comfortably with spine straight."},
    {"step": 2, "instruction": "Close your left nostril with ring finger."},
    {"step": 3, "instruction": "Inhale slowly through right nostril only."},
    {"step": 4, "instruction": "Close both nostrils and hold briefly."},
    {"step": 5, "instruction": "Exhale through left nostril."},
    {"step": 6, "instruction": "Repeat: always inhale right, exhale left."}
  ]'::jsonb,
  'Avoid if you have high blood pressure or heart conditions. Best done in morning.',
  'solfeggio_528',
  'india',
  true,
  'Sun-piercing breath from Hatha Yoga - activates Pingala nadi (solar channel).',
  ARRAY['Increases energy', 'Warms body', 'Improves digestion', 'Boosts metabolism'],
  ARRAY['Best practiced in the morning', 'Avoid before sleep', 'Great for cold days'],
  '{"inhale": 4, "hold": 4, "exhale": 4, "rest": 0}'::jsonb
),
(
  'Chandra Bhedana',
  'Left nostril breathing to activate the lunar/cooling/calming channel.',
  'breathing',
  'intermediate',
  10,
  '[
    {"step": 1, "instruction": "Sit comfortably with spine straight."},
    {"step": 2, "instruction": "Close your right nostril with thumb."},
    {"step": 3, "instruction": "Inhale slowly through left nostril only."},
    {"step": 4, "instruction": "Close both nostrils and hold briefly."},
    {"step": 5, "instruction": "Exhale through right nostril."},
    {"step": 6, "instruction": "Repeat: always inhale left, exhale right."}
  ]'::jsonb,
  'Avoid if you have low blood pressure or depression. Best done in evening.',
  'nature_ocean',
  'india',
  true,
  'Moon-piercing breath from Hatha Yoga - activates Ida nadi (lunar channel).',
  ARRAY['Cools body', 'Calms mind', 'Reduces stress', 'Aids sleep'],
  ARRAY['Best practiced in evening', 'Great for hot days', 'Helps with insomnia'],
  '{"inhale": 4, "hold": 4, "exhale": 4, "rest": 0}'::jsonb
);

-- ============================================
-- VAGAL TONING EXERCISES
-- ============================================

INSERT INTO exercises (name, description, category, level, duration_minutes, instructions, safety_warning, audio_preset, origin, is_premium, history, benefits, tips, breathing_pattern) VALUES
(
  'Vocal Toning',
  'Use your voice to create vibrations that stimulate the vagus nerve.',
  'sensory',
  'beginner',
  5,
  '[
    {"step": 1, "instruction": "Sit or stand comfortably."},
    {"step": 2, "instruction": "Take a deep breath in."},
    {"step": 3, "instruction": "On exhale, make a long ''OOOOMMM'' or ''AAAHHH'' sound."},
    {"step": 4, "instruction": "Feel the vibration in your chest and throat."},
    {"step": 5, "instruction": "Experiment with different pitches."},
    {"step": 6, "instruction": "Continue for 3-5 minutes."}
  ]'::jsonb,
  NULL,
  'om',
  'universal',
  false,
  'Vocal vibrations have been used across cultures to induce calm and connection.',
  ARRAY['Stimulates vagus nerve', 'Reduces stress', 'Opens throat', 'Grounds energy'],
  ARRAY['Lower pitches create stronger chest vibrations', 'Don''t strain your voice', 'Hum if you prefer'],
  '{"inhale": 4, "hold": 0, "exhale": 8, "rest": 2}'::jsonb
),
(
  'Gargling',
  'Simple gargling activates muscles connected to the vagus nerve.',
  'sensory',
  'beginner',
  2,
  '[
    {"step": 1, "instruction": "Fill a glass with water."},
    {"step": 2, "instruction": "Take a sip of water."},
    {"step": 3, "instruction": "Tilt head back and gargle vigorously."},
    {"step": 4, "instruction": "Continue until you need to breathe."},
    {"step": 5, "instruction": "Spit out and repeat."},
    {"step": 6, "instruction": "Do this for 1-2 minutes daily."}
  ]'::jsonb,
  NULL,
  'silence',
  'universal',
  false,
  'The muscles used in gargling are innervated by the vagus nerve.',
  ARRAY['Tones vagus nerve', 'Easy daily practice', 'Improves gag reflex'],
  ARRAY['Do it while brushing teeth', 'Gargle until eyes water slightly', 'Twice daily is ideal'],
  NULL
),
(
  'Diving Reflex',
  'Cold water on face triggers the mammalian diving reflex, instantly calming you.',
  'water',
  'beginner',
  2,
  '[
    {"step": 1, "instruction": "Fill a bowl with cold water (or use cold, wet towel)."},
    {"step": 2, "instruction": "Take a deep breath and hold it."},
    {"step": 3, "instruction": "Submerge your face in the cold water (or apply towel)."},
    {"step": 4, "instruction": "Hold for 15-30 seconds."},
    {"step": 5, "instruction": "Come up, breathe normally."},
    {"step": 6, "instruction": "Repeat 2-3 times if needed."}
  ]'::jsonb,
  'Avoid if you have heart conditions. Don''t hold breath too long.',
  'silence',
  'universal',
  false,
  'The diving reflex is hardwired in all mammals - it slows heart rate instantly.',
  ARRAY['Instant calm', 'Slows heart rate', 'Reduces panic', 'Activates parasympathetic'],
  ARRAY['Water should be cold but not ice', 'Focus on forehead and cheeks', 'Great for panic attacks'],
  NULL
),
(
  'Eye Movement Exercise',
  'Gentle eye movements that stimulate the vagus nerve and reduce stress.',
  'sensory',
  'beginner',
  3,
  '[
    {"step": 1, "instruction": "Lie on your back comfortably."},
    {"step": 2, "instruction": "Interlace fingers behind your head."},
    {"step": 3, "instruction": "Without moving your head, look to the right."},
    {"step": 4, "instruction": "Hold for 30-60 seconds until you sigh or yawn."},
    {"step": 5, "instruction": "Return to center, then look left."},
    {"step": 6, "instruction": "Hold again until you sigh, swallow, or yawn."}
  ]'::jsonb,
  NULL,
  'silence',
  'usa',
  false,
  'Based on Stanley Rosenberg''s work on the vagus nerve and cranial nerves.',
  ARRAY['Releases neck tension', 'Calms nervous system', 'Reduces anxiety'],
  ARRAY['A sigh or yawn means it''s working', 'Keep head still', 'Can do seated too'],
  NULL
);

-- ============================================
-- MOVEMENT + BREATH
-- ============================================

INSERT INTO exercises (name, description, category, level, duration_minutes, instructions, safety_warning, audio_preset, origin, is_premium, history, benefits, tips, breathing_pattern) VALUES
(
  'Five Tibetan Rites',
  'Ancient sequence of 5 movements synchronized with breath for vitality.',
  'movement',
  'intermediate',
  15,
  '[
    {"step": 1, "instruction": "Rite 1: Spin clockwise with arms out, 21 times."},
    {"step": 2, "instruction": "Rite 2: Lie flat, raise legs and head together, 21 times."},
    {"step": 3, "instruction": "Rite 3: Kneel, arch back, then flex forward, 21 times."},
    {"step": 4, "instruction": "Rite 4: Sit, raise body into table pose, 21 times."},
    {"step": 5, "instruction": "Rite 5: Downward dog to upward dog flow, 21 times."},
    {"step": 6, "instruction": "Start with 3-7 reps each, build to 21 over weeks."}
  ]'::jsonb,
  'Start with few repetitions. Not for pregnancy or serious back issues.',
  'tibetan_bowl',
  'tibet',
  true,
  'Allegedly from Tibetan monks, popularized in 1939 book "The Eye of Revelation".',
  ARRAY['Increases energy', 'Balances chakras', 'Improves flexibility', 'Anti-aging'],
  ARRAY['Build up slowly to 21 reps', 'Do every morning', 'Breathe with each movement'],
  '{"inhale": 4, "hold": 0, "exhale": 4, "rest": 0}'::jsonb
),
(
  'Body Scan Meditation',
  'Systematic attention to body sensations combined with breath awareness.',
  'sensory',
  'beginner',
  15,
  '[
    {"step": 1, "instruction": "Lie down comfortably on your back."},
    {"step": 2, "instruction": "Close eyes and take 3 deep breaths."},
    {"step": 3, "instruction": "Bring attention to your feet. Notice sensations."},
    {"step": 4, "instruction": "Slowly move attention up: legs, hips, belly, chest."},
    {"step": 5, "instruction": "Continue to arms, hands, neck, face, head."},
    {"step": 6, "instruction": "If you find tension, breathe into that area."}
  ]'::jsonb,
  NULL,
  'nature_forest',
  'usa',
  false,
  'Core MBSR (Mindfulness-Based Stress Reduction) practice developed by Jon Kabat-Zinn.',
  ARRAY['Reduces tension', 'Increases body awareness', 'Promotes relaxation', 'Aids sleep'],
  ARRAY['Don''t try to change anything, just notice', 'It''s okay to fall asleep', 'Do before bed'],
  '{"inhale": 4, "hold": 0, "exhale": 6, "rest": 0}'::jsonb
),
(
  'Walking Meditation',
  'Mindful walking synchronized with breath for moving meditation.',
  'movement',
  'beginner',
  10,
  '[
    {"step": 1, "instruction": "Find a path where you can walk slowly (10-20 steps)."},
    {"step": 2, "instruction": "Stand still, take 3 deep breaths."},
    {"step": 3, "instruction": "Begin walking very slowly, feeling each step."},
    {"step": 4, "instruction": "Coordinate: inhale for 2-3 steps, exhale for 2-3 steps."},
    {"step": 5, "instruction": "At the end, turn slowly and walk back."},
    {"step": 6, "instruction": "Continue for 10-15 minutes."}
  ]'::jsonb,
  NULL,
  'silence',
  'universal',
  false,
  'Buddhist practice found in Zen and Theravada traditions for active mindfulness.',
  ARRAY['Grounds energy', 'Calms racing mind', 'Connects body and mind'],
  ARRAY['Walk slower than normal', 'Can count steps with breath', 'Barefoot is nice'],
  '{"inhale": 3, "hold": 0, "exhale": 3, "rest": 0}'::jsonb
);

-- ============================================
-- SLEEP EXERCISES
-- ============================================

INSERT INTO exercises (name, description, category, level, duration_minutes, instructions, safety_warning, audio_preset, origin, is_premium, history, benefits, tips, breathing_pattern) VALUES
(
  'Military Sleep Method',
  'Technique used by military to fall asleep in 2 minutes or less.',
  'sensory',
  'beginner',
  5,
  '[
    {"step": 1, "instruction": "Lie down and relax your entire face, including tongue and jaw."},
    {"step": 2, "instruction": "Drop your shoulders and let arms hang loose."},
    {"step": 3, "instruction": "Exhale and relax your chest."},
    {"step": 4, "instruction": "Relax your legs from thighs down to feet."},
    {"step": 5, "instruction": "Clear your mind for 10 seconds. Think ''don''t think''."},
    {"step": 6, "instruction": "Picture yourself in a calm place, or repeat ''don''t think''."}
  ]'::jsonb,
  NULL,
  'silence',
  'usa',
  false,
  'Developed by US Navy Pre-Flight School to help pilots sleep in any conditions.',
  ARRAY['Fall asleep fast', 'Works anywhere', 'Reduces insomnia'],
  ARRAY['Takes 6 weeks of practice to master', 'Relax face completely first', 'Works 96% of the time with practice'],
  NULL
),
(
  'Progressive Muscle Relaxation',
  'Systematically tense and release muscle groups to release physical tension.',
  'sensory',
  'beginner',
  15,
  '[
    {"step": 1, "instruction": "Lie down comfortably. Take 3 deep breaths."},
    {"step": 2, "instruction": "Squeeze your feet tightly for 5 seconds, then release."},
    {"step": 3, "instruction": "Move to calves: squeeze 5 seconds, release."},
    {"step": 4, "instruction": "Continue up: thighs, glutes, belly, chest, hands, arms."},
    {"step": 5, "instruction": "Squeeze face muscles, then release completely."},
    {"step": 6, "instruction": "Finally, tense entire body at once, then let go."}
  ]'::jsonb,
  NULL,
  'nature_rain',
  'usa',
  false,
  'Developed by Edmund Jacobson in the 1920s for anxiety and tension relief.',
  ARRAY['Releases muscle tension', 'Reduces anxiety', 'Improves sleep', 'Body awareness'],
  ARRAY['Squeeze at 70% intensity, not max', 'Notice the contrast after releasing', 'Great before bed'],
  NULL
),
(
  'Yoga Nidra',
  'Yogic sleep - a guided practice between waking and sleeping states.',
  'sensory',
  'beginner',
  20,
  '[
    {"step": 1, "instruction": "Lie in Savasana (corpse pose) with eyes closed."},
    {"step": 2, "instruction": "Set a Sankalpa (positive intention/resolve)."},
    {"step": 3, "instruction": "Rotate awareness through body parts systematically."},
    {"step": 4, "instruction": "Observe breath without changing it."},
    {"step": 5, "instruction": "Visualize peaceful images or scenes."},
    {"step": 6, "instruction": "Return to Sankalpa, then slowly wake up."}
  ]'::jsonb,
  NULL,
  'binaural_delta',
  'india',
  true,
  'Ancient tantric practice systematized by Swami Satyananda Saraswati in the 1960s.',
  ARRAY['Deep rest', 'Reduces anxiety', 'Improves sleep', 'Accesses subconscious'],
  ARRAY['One hour equals 4 hours of sleep', 'Stay awake but deeply relaxed', 'Use guided audio'],
  '{"inhale": 4, "hold": 0, "exhale": 6, "rest": 0}'::jsonb
),
(
  '2-Minute Relaxation',
  'Quick relaxation technique for instant stress relief.',
  'breathing',
  'beginner',
  2,
  '[
    {"step": 1, "instruction": "Stop what you''re doing. Close your eyes."},
    {"step": 2, "instruction": "Take a deep breath in for 4 seconds."},
    {"step": 3, "instruction": "Hold for 2 seconds."},
    {"step": 4, "instruction": "Exhale slowly for 6 seconds while relaxing shoulders."},
    {"step": 5, "instruction": "Repeat 4-5 times."},
    {"step": 6, "instruction": "Open eyes slowly, feeling calmer."}
  ]'::jsonb,
  NULL,
  'silence',
  'universal',
  false,
  'Simple technique combining breathing and progressive relaxation principles.',
  ARRAY['Quick stress relief', 'Can do anywhere', 'Resets nervous system'],
  ARRAY['Perfect for work breaks', 'Do before stressful meetings', 'Set phone reminder'],
  '{"inhale": 4, "hold": 2, "exhale": 6, "rest": 0}'::jsonb
);
