-- ============================================
-- VagoFlow Seed Data
-- ============================================

-- ============================================
-- BREATHING EXERCISES
-- ============================================

INSERT INTO exercises (name, description, category, level, duration_minutes, instructions, safety_warning) VALUES
(
  'Box Breathing',
  'A simple technique to calm your nervous system and reduce stress. Used by Navy SEALs for focus and calm.',
  'breathing',
  'beginner',
  5,
  '[
    {"step": 1, "instruction": "Sit comfortably with your back straight and feet flat on the floor."},
    {"step": 2, "instruction": "Inhale slowly through your nose for 4 seconds."},
    {"step": 3, "instruction": "Hold your breath for 4 seconds."},
    {"step": 4, "instruction": "Exhale slowly through your mouth for 4 seconds."},
    {"step": 5, "instruction": "Hold your breath for 4 seconds."},
    {"step": 6, "instruction": "Repeat the cycle for the duration of the session."}
  ]'::jsonb,
  NULL
),
(
  '4-7-8 Breathing',
  'Promotes relaxation and helps with falling asleep faster. Also known as the relaxing breath.',
  'breathing',
  'beginner',
  10,
  '[
    {"step": 1, "instruction": "Place the tip of your tongue against the ridge behind your upper front teeth."},
    {"step": 2, "instruction": "Exhale completely through your mouth, making a whoosh sound."},
    {"step": 3, "instruction": "Inhale quietly through your nose for 4 seconds."},
    {"step": 4, "instruction": "Hold your breath for 7 seconds."},
    {"step": 5, "instruction": "Exhale completely through your mouth for 8 seconds."},
    {"step": 6, "instruction": "Repeat the cycle 3-4 times."}
  ]'::jsonb,
  'If you feel dizzy, return to normal breathing.'
),
(
  'Diaphragmatic Breathing',
  'Strengthens the diaphragm and decreases oxygen demand. Great for stress relief and core engagement.',
  'breathing',
  'intermediate',
  15,
  '[
    {"step": 1, "instruction": "Lie on your back with knees bent, or sit comfortably."},
    {"step": 2, "instruction": "Place one hand on your chest and one on your belly."},
    {"step": 3, "instruction": "Breathe in slowly through your nose, feeling your belly rise."},
    {"step": 4, "instruction": "Your chest should remain relatively still."},
    {"step": 5, "instruction": "Exhale slowly through pursed lips, feeling your belly fall."},
    {"step": 6, "instruction": "Continue for the duration, focusing on belly movement."}
  ]'::jsonb,
  NULL
),
(
  'Resonant Breathing',
  'Syncs your breath with your heart rate for maximum calm. Achieves heart coherence at ~5 breaths per minute.',
  'breathing',
  'beginner',
  5,
  '[
    {"step": 1, "instruction": "Find a comfortable seated position."},
    {"step": 2, "instruction": "Inhale slowly for 6 seconds."},
    {"step": 3, "instruction": "Exhale slowly for 6 seconds."},
    {"step": 4, "instruction": "Maintain this rhythm without pausing between breaths."},
    {"step": 5, "instruction": "Focus on the smooth, continuous flow of breath."}
  ]'::jsonb,
  NULL
),
(
  'Alternate Nostril Breathing',
  'Balances the left and right hemispheres of the brain. A yogic practice for mental clarity.',
  'breathing',
  'intermediate',
  10,
  '[
    {"step": 1, "instruction": "Sit comfortably with your spine straight."},
    {"step": 2, "instruction": "Use your right thumb to close your right nostril."},
    {"step": 3, "instruction": "Inhale slowly through your left nostril."},
    {"step": 4, "instruction": "Close your left nostril with your ring finger."},
    {"step": 5, "instruction": "Open your right nostril and exhale slowly."},
    {"step": 6, "instruction": "Inhale through the right nostril."},
    {"step": 7, "instruction": "Close right nostril, open left, and exhale."},
    {"step": 8, "instruction": "This completes one cycle. Repeat for the session duration."}
  ]'::jsonb,
  'Avoid if you have a cold or nasal congestion.'
);

-- ============================================
-- WATER EXERCISES
-- ============================================

INSERT INTO exercises (name, description, category, level, duration_minutes, instructions, safety_warning) VALUES
(
  'Cold Water Facial Immersion',
  'Triggers the diving reflex to activate the parasympathetic nervous system rapidly.',
  'water',
  'intermediate',
  2,
  '[
    {"step": 1, "instruction": "Fill a bowl with cold water. Add ice cubes for a more potent effect."},
    {"step": 2, "instruction": "Take a deep breath and hold it."},
    {"step": 3, "instruction": "Lean forward and gently submerge your face in the water."},
    {"step": 4, "instruction": "Focus on the area around your eyes and cheeks."},
    {"step": 5, "instruction": "Keep your face submerged for 15-30 seconds."},
    {"step": 6, "instruction": "Come up for air and repeat 2-3 times as comfortable."},
    {"step": 7, "instruction": "Gently pat your face dry and notice the shift in your body."}
  ]'::jsonb,
  'Consult your doctor before trying this exercise if you have a heart condition or low blood pressure. Do not force yourself to hold your breath.'
),
(
  'Gargling',
  'Stimulates the vagus nerve through the muscles in the back of the throat.',
  'water',
  'beginner',
  3,
  '[
    {"step": 1, "instruction": "Take a sip of water."},
    {"step": 2, "instruction": "Tilt your head back slightly."},
    {"step": 3, "instruction": "Gargle vigorously for 30-60 seconds."},
    {"step": 4, "instruction": "Spit out the water."},
    {"step": 5, "instruction": "Repeat 2-3 times."},
    {"step": 6, "instruction": "You may feel a slight contraction in your throat muscles."}
  ]'::jsonb,
  NULL
),
(
  'Mindful Drinking',
  'Combines slow drinking with breath awareness for gentle vagal activation.',
  'water',
  'beginner',
  5,
  '[
    {"step": 1, "instruction": "Prepare a glass of room temperature water."},
    {"step": 2, "instruction": "Hold the glass and take a moment to feel its weight and temperature."},
    {"step": 3, "instruction": "Take a slow breath in."},
    {"step": 4, "instruction": "Take a small sip and hold the water in your mouth for a moment."},
    {"step": 5, "instruction": "Swallow slowly and mindfully."},
    {"step": 6, "instruction": "Exhale slowly after swallowing."},
    {"step": 7, "instruction": "Repeat until the glass is empty, maintaining awareness."}
  ]'::jsonb,
  NULL
);

-- ============================================
-- MOVEMENT EXERCISES
-- ============================================

INSERT INTO exercises (name, description, category, level, duration_minutes, instructions, safety_warning) VALUES
(
  'Neck Stretches',
  'Gentle stretches to release tension and stimulate the vagus nerve in the neck area.',
  'movement',
  'beginner',
  5,
  '[
    {"step": 1, "instruction": "Sit or stand with your spine straight."},
    {"step": 2, "instruction": "Slowly tilt your head to the right, bringing your ear toward your shoulder."},
    {"step": 3, "instruction": "Hold for 30 seconds, breathing deeply."},
    {"step": 4, "instruction": "Return to center and repeat on the left side."},
    {"step": 5, "instruction": "Gently rotate your head in a circle, 5 times each direction."},
    {"step": 6, "instruction": "Finish by tucking your chin to your chest and holding for 30 seconds."}
  ]'::jsonb,
  'Move slowly and never force your neck into uncomfortable positions.'
),
(
  'Eye Yoga',
  'Gentle eye movements that stimulate the vagus nerve and reduce eye strain.',
  'movement',
  'beginner',
  5,
  '[
    {"step": 1, "instruction": "Sit comfortably and relax your shoulders."},
    {"step": 2, "instruction": "Without moving your head, look up as far as comfortable, then down. Repeat 5 times."},
    {"step": 3, "instruction": "Look left, then right. Repeat 5 times."},
    {"step": 4, "instruction": "Look diagonally: upper left to lower right, then upper right to lower left. 5 times each."},
    {"step": 5, "instruction": "Slowly circle your eyes clockwise 5 times, then counter-clockwise."},
    {"step": 6, "instruction": "Close your eyes and rest for 30 seconds."}
  ]'::jsonb,
  NULL
),
(
  'Legs Up The Wall',
  'A restorative yoga pose that activates the parasympathetic nervous system.',
  'movement',
  'beginner',
  10,
  '[
    {"step": 1, "instruction": "Find a clear wall space and sit sideways next to it."},
    {"step": 2, "instruction": "Swing your legs up onto the wall as you lower your back to the floor."},
    {"step": 3, "instruction": "Scoot your hips as close to the wall as comfortable."},
    {"step": 4, "instruction": "Rest your arms by your sides, palms facing up."},
    {"step": 5, "instruction": "Close your eyes and breathe naturally."},
    {"step": 6, "instruction": "Stay in this position for the duration, allowing gravity to do the work."},
    {"step": 7, "instruction": "To exit, bend your knees and roll to one side before sitting up."}
  ]'::jsonb,
  'Avoid if you have glaucoma, high blood pressure, or are menstruating heavily.'
);

-- ============================================
-- SENSORY EXERCISES
-- ============================================

INSERT INTO exercises (name, description, category, level, duration_minutes, instructions, safety_warning) VALUES
(
  'Humming / OM Chanting',
  'Vibrations from humming stimulate the vagus nerve through the larynx.',
  'sensory',
  'beginner',
  5,
  '[
    {"step": 1, "instruction": "Sit comfortably with your spine straight."},
    {"step": 2, "instruction": "Take a deep breath in through your nose."},
    {"step": 3, "instruction": "As you exhale, make a humming sound (like mmmmm) or chant OM."},
    {"step": 4, "instruction": "Feel the vibration in your throat, chest, and head."},
    {"step": 5, "instruction": "Continue for the duration, taking natural breaths between hums."},
    {"step": 6, "instruction": "Experiment with different pitches to find what feels most resonant."}
  ]'::jsonb,
  NULL
),
(
  'Cold Exposure',
  'Brief cold exposure activates the vagus nerve and builds stress resilience.',
  'sensory',
  'advanced',
  3,
  '[
    {"step": 1, "instruction": "At the end of your regular shower, prepare mentally for cold water."},
    {"step": 2, "instruction": "Take a deep breath and turn the water to cold."},
    {"step": 3, "instruction": "Start with 30 seconds of cold water on your body."},
    {"step": 4, "instruction": "Focus on slow, controlled breathing."},
    {"step": 5, "instruction": "Gradually increase duration over days/weeks up to 2-3 minutes."},
    {"step": 6, "instruction": "End with the cold water and step out feeling invigorated."}
  ]'::jsonb,
  'Avoid if you have heart conditions, Raynauds disease, or are pregnant. Start gradually and never force yourself.'
),
(
  'Voluntary Yawning',
  'Yawning activates the vagus nerve and releases tension in the jaw and face.',
  'sensory',
  'beginner',
  3,
  '[
    {"step": 1, "instruction": "Sit or lie down comfortably."},
    {"step": 2, "instruction": "Open your mouth wide as if starting a yawn."},
    {"step": 3, "instruction": "Even if you do not feel like yawning, mimic the motion."},
    {"step": 4, "instruction": "Often, a real yawn will follow the fake one."},
    {"step": 5, "instruction": "Allow your body to yawn naturally and fully."},
    {"step": 6, "instruction": "Repeat several times, allowing any sounds or stretches that come naturally."}
  ]'::jsonb,
  NULL
);
