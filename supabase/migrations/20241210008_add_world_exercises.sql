-- ============================================
-- World Breathing & Vagal Techniques
-- Additional exercises from global traditions
-- ============================================

-- First, add new origin values if needed
DO $$
BEGIN
  -- Check if exercise_origin type exists and add new values
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exercise_origin') THEN
    BEGIN
      ALTER TYPE exercise_origin ADD VALUE IF NOT EXISTS 'russia';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TYPE exercise_origin ADD VALUE IF NOT EXISTS 'korea';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TYPE exercise_origin ADD VALUE IF NOT EXISTS 'indonesia';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TYPE exercise_origin ADD VALUE IF NOT EXISTS 'africa';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TYPE exercise_origin ADD VALUE IF NOT EXISTS 'greece';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TYPE exercise_origin ADD VALUE IF NOT EXISTS 'native_america';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TYPE exercise_origin ADD VALUE IF NOT EXISTS 'brazil';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TYPE exercise_origin ADD VALUE IF NOT EXISTS 'australia';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TYPE exercise_origin ADD VALUE IF NOT EXISTS 'scandinavia';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TYPE exercise_origin ADD VALUE IF NOT EXISTS 'mexico';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TYPE exercise_origin ADD VALUE IF NOT EXISTS 'thailand';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TYPE exercise_origin ADD VALUE IF NOT EXISTS 'mongolia';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TYPE exercise_origin ADD VALUE IF NOT EXISTS 'persia';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TYPE exercise_origin ADD VALUE IF NOT EXISTS 'netherlands';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- ============================================
-- RUSSIAN TECHNIQUES (Systema)
-- ============================================

INSERT INTO exercises (name, description, category, level, duration_minutes, instructions, safety_warning, audio_preset, origin, is_premium, history, benefits, tips, breathing_pattern) VALUES
(
  'Systema Breathing',
  'Russian martial arts breathing for stress resilience and recovery. Used by Spetsnaz special forces.',
  'breathing',
  'intermediate',
  10,
  '[
    {"step": 1, "instruction": "Stand or sit naturally, completely relaxed."},
    {"step": 2, "instruction": "Inhale through nose, exhale through mouth - continuous flow."},
    {"step": 3, "instruction": "Match breath to movement or stress level."},
    {"step": 4, "instruction": "Under stress: short quick breaths. Calm: long slow breaths."},
    {"step": 5, "instruction": "Never hold your breath, keep it flowing."},
    {"step": 6, "instruction": "Practice recovery breathing: deep inhale, very long exhale."}
  ]'::jsonb,
  NULL,
  'nature_forest',
  'russia',
  true,
  'Developed from ancient Russian Orthodox breathing practices, refined by Mikhail Ryabko for Systema martial arts. Used by Russian special forces for extreme stress management.',
  ARRAY['Extreme stress resilience', 'Quick recovery', 'Pain management', 'Mental clarity under pressure'],
  ARRAY['Breath should never stop flowing', 'Exhale longer than inhale for calm', 'Can be practiced during any activity'],
  '{"inhale": 4, "hold": 0, "exhale": 8, "rest": 0}'::jsonb
),
(
  'Burst Breathing',
  'Short, sharp breaths to energize and reset the nervous system. From Russian Systema.',
  'breathing',
  'advanced',
  5,
  '[
    {"step": 1, "instruction": "Stand with feet shoulder-width apart."},
    {"step": 2, "instruction": "Take 20-30 rapid burst breaths through nose."},
    {"step": 3, "instruction": "Each breath is like a quick sniff - sharp and quick."},
    {"step": 4, "instruction": "After the bursts, exhale completely and hold."},
    {"step": 5, "instruction": "Hold empty as long as comfortable."},
    {"step": 6, "instruction": "Resume normal breathing. Repeat 2-3 rounds."}
  ]'::jsonb,
  'May cause lightheadedness. Practice seated or lying down first.',
  'binaural_alpha',
  'russia',
  true,
  'Systema combat breathing technique for instant energy and alertness.',
  ARRAY['Instant energy boost', 'Clears mental fog', 'Prepares for action', 'Resets nervous system'],
  ARRAY['Keep bursts rhythmic', 'Don''t hyperventilate', 'Great before cold exposure'],
  '{"inhale": 0.5, "hold": 0, "exhale": 0.5, "rest": 0, "special": "rapid", "cycles": 30}'::jsonb
);

-- ============================================
-- KOREAN TECHNIQUES (Dahn/Sundo)
-- ============================================

INSERT INTO exercises (name, description, category, level, duration_minutes, instructions, safety_warning, audio_preset, origin, is_premium, history, benefits, tips, breathing_pattern) VALUES
(
  'Dahn Jon Breathing',
  'Korean energy center breathing. Focus on the lower belly energy center (Dahn Jon).',
  'breathing',
  'beginner',
  10,
  '[
    {"step": 1, "instruction": "Sit comfortably, spine straight but relaxed."},
    {"step": 2, "instruction": "Place both hands on lower belly, 2 inches below navel."},
    {"step": 3, "instruction": "Inhale deeply, expanding the lower belly into your hands."},
    {"step": 4, "instruction": "Exhale slowly, gently drawing belly inward."},
    {"step": 5, "instruction": "Focus attention on the warmth building in your Dahn Jon."},
    {"step": 6, "instruction": "Continue for 10-15 minutes, cultivating energy."}
  ]'::jsonb,
  NULL,
  'solfeggio_396',
  'korea',
  false,
  'From Korean Sundo tradition, dating back thousands of years. Dahn Jon (단전) is the Korean equivalent of Chinese Dantian.',
  ARRAY['Builds core energy', 'Improves digestion', 'Emotional stability', 'Grounding effect'],
  ARRAY['Belly should move, not chest', 'Imagine a glowing ball of energy', 'Best done on empty stomach'],
  '{"inhale": 5, "hold": 0, "exhale": 7, "rest": 0}'::jsonb
),
(
  'Jang Saeng Breathing',
  'Korean longevity breath for health and vitality. Ancient Sundo practice.',
  'breathing',
  'intermediate',
  15,
  '[
    {"step": 1, "instruction": "Sit in half-lotus or comfortable cross-legged position."},
    {"step": 2, "instruction": "Straighten spine, tuck chin slightly, relax shoulders."},
    {"step": 3, "instruction": "Inhale for 5 counts, filling from belly to chest."},
    {"step": 4, "instruction": "Hold breath for 5 counts, concentrating on third eye."},
    {"step": 5, "instruction": "Exhale for 10 counts, emptying from chest to belly."},
    {"step": 6, "instruction": "Visualize golden light filling your body on inhale."}
  ]'::jsonb,
  NULL,
  'solfeggio_528',
  'korea',
  true,
  'From Korean mountain hermit (Sundo) tradition for achieving longevity and spiritual development.',
  ARRAY['Promotes longevity', 'Balances energy', 'Clears mind', 'Strengthens immunity'],
  ARRAY['Practice at same time daily', 'Morning facing east is ideal', 'Minimum 100 days for transformation'],
  '{"inhale": 5, "hold": 5, "exhale": 10, "rest": 0}'::jsonb
);

-- ============================================
-- INDONESIAN/BALINESE TECHNIQUES
-- ============================================

INSERT INTO exercises (name, description, category, level, duration_minutes, instructions, safety_warning, audio_preset, origin, is_premium, history, benefits, tips, breathing_pattern) VALUES
(
  'Pranayama Bali',
  'Balinese temple breathing for spiritual cleansing and connection with nature spirits.',
  'breathing',
  'intermediate',
  15,
  '[
    {"step": 1, "instruction": "Sit facing the rising sun or natural beauty."},
    {"step": 2, "instruction": "Close eyes and feel connection with nature around you."},
    {"step": 3, "instruction": "Inhale slowly, imagining drawing in energy from nature."},
    {"step": 4, "instruction": "Hold briefly, feeling gratitude in your heart."},
    {"step": 5, "instruction": "Exhale releasing any negative energy back to earth for transformation."},
    {"step": 6, "instruction": "Continue with deep reverence for the natural world."}
  ]'::jsonb,
  NULL,
  'nature_forest',
  'indonesia',
  true,
  'Balinese Hindu breathing practice (Pranayama) adapted with local animist traditions. Part of daily temple offerings ritual.',
  ARRAY['Spiritual connection', 'Nature attunement', 'Inner peace', 'Gratitude cultivation'],
  ARRAY['Best practiced outdoors', 'Face water, mountains, or trees', 'Combine with flower offerings'],
  '{"inhale": 6, "hold": 2, "exhale": 6, "rest": 2}'::jsonb
),
(
  'Tenaga Dalam',
  'Indonesian inner power breathing. Martial arts technique for cultivating internal energy.',
  'breathing',
  'advanced',
  15,
  '[
    {"step": 1, "instruction": "Stand in horse stance or sit in meditation posture."},
    {"step": 2, "instruction": "Breathe deeply into lower belly with full attention."},
    {"step": 3, "instruction": "On inhale, tense muscles progressively from feet upward."},
    {"step": 4, "instruction": "Hold breath and full tension for 5-10 seconds."},
    {"step": 5, "instruction": "Exhale explosively, releasing all tension at once."},
    {"step": 6, "instruction": "Feel the energy circulating. Repeat 7 times."}
  ]'::jsonb,
  'Do not practice with high blood pressure or heart conditions.',
  'binaural_theta',
  'indonesia',
  true,
  'From Indonesian Pencak Silat martial arts. Tenaga Dalam means "inner power" - cultivating chi/prana through breath and tension.',
  ARRAY['Builds internal power', 'Increases energy', 'Strengthens will', 'Body awareness'],
  ARRAY['Tension should be progressive', 'Release must be complete', 'Not for beginners'],
  '{"inhale": 4, "hold": 10, "exhale": 2, "rest": 4}'::jsonb
);

-- ============================================
-- AFRICAN TECHNIQUES
-- ============================================

INSERT INTO exercises (name, description, category, level, duration_minutes, instructions, safety_warning, audio_preset, origin, is_premium, history, benefits, tips, breathing_pattern) VALUES
(
  'Ubuntu Breath',
  'African communal breathing practice. "I am because we are" - breathing in connection with others.',
  'breathing',
  'beginner',
  10,
  '[
    {"step": 1, "instruction": "Sit comfortably, ideally in a circle with others (or visualize community)."},
    {"step": 2, "instruction": "Place hand on heart and breathe naturally."},
    {"step": 3, "instruction": "Inhale, imagining receiving love and support from your community."},
    {"step": 4, "instruction": "Exhale, sending love and support back to your community."},
    {"step": 5, "instruction": "Feel the interconnection with all beings."},
    {"step": 6, "instruction": "Continue, expanding your circle to include all humanity."}
  ]'::jsonb,
  NULL,
  'solfeggio_639',
  'africa',
  false,
  'Based on Ubuntu philosophy from Southern Africa. Ubuntu means "humanity toward others" - the belief in universal bond of sharing.',
  ARRAY['Reduces isolation', 'Cultivates compassion', 'Strengthens community bonds', 'Heart opening'],
  ARRAY['Can practice alone visualizing community', 'Powerful in groups', 'Focus on giving and receiving equally'],
  '{"inhale": 4, "hold": 0, "exhale": 4, "rest": 2}'::jsonb
),
(
  'Zulu Warrior Breath',
  'Powerful breathing technique for courage and strength. From Zulu warrior traditions.',
  'breathing',
  'intermediate',
  5,
  '[
    {"step": 1, "instruction": "Stand tall with feet wide, hands on hips like a warrior."},
    {"step": 2, "instruction": "Inhale powerfully through nose, expanding chest and belly."},
    {"step": 3, "instruction": "Hold briefly, feeling your power and courage."},
    {"step": 4, "instruction": "Exhale with a strong ''HA!'' sound from deep in belly."},
    {"step": 5, "instruction": "Stamp foot on exhale for grounding."},
    {"step": 6, "instruction": "Repeat 10-20 times, building energy and courage."}
  ]'::jsonb,
  NULL,
  'binaural_alpha',
  'africa',
  true,
  'Inspired by Zulu warrior preparation rituals. Warriors would breathe and chant together before battle.',
  ARRAY['Builds courage', 'Increases confidence', 'Energizes body', 'Releases fear'],
  ARRAY['Really commit to the sound', 'Let yourself be loud', 'Great before challenging situations'],
  '{"inhale": 3, "hold": 1, "exhale": 2, "rest": 0, "special": "ha_sound"}'::jsonb
),
(
  'Yoruba Ase Breathing',
  'Nigerian spiritual breathing to activate Ase - the life force and power to make things happen.',
  'breathing',
  'intermediate',
  10,
  '[
    {"step": 1, "instruction": "Sit or stand with spine straight, feet grounded."},
    {"step": 2, "instruction": "Place hands on lower belly where Ase resides."},
    {"step": 3, "instruction": "Inhale slowly through nose, filling belly with life force."},
    {"step": 4, "instruction": "Whisper ''Ase'' (ah-shay) on the exhale."},
    {"step": 5, "instruction": "Feel the word vibrating through your body."},
    {"step": 6, "instruction": "Continue, setting intentions for what you wish to manifest."}
  ]'::jsonb,
  NULL,
  'om',
  'africa',
  true,
  'From Yoruba spiritual tradition of Nigeria. Ase (also Ashe) is the divine life force that flows through all things.',
  ARRAY['Activates life force', 'Manifestation power', 'Spiritual connection', 'Empowerment'],
  ARRAY['Ase is pronounced ah-SHAY', 'Set clear intentions', 'Practice with gratitude'],
  '{"inhale": 5, "hold": 2, "exhale": 6, "rest": 2}'::jsonb
);

-- ============================================
-- NATIVE AMERICAN TECHNIQUES
-- ============================================

INSERT INTO exercises (name, description, category, level, duration_minutes, instructions, safety_warning, audio_preset, origin, is_premium, history, benefits, tips, breathing_pattern) VALUES
(
  'Four Directions Breath',
  'Native American medicine wheel breathing honoring the four sacred directions.',
  'breathing',
  'beginner',
  10,
  '[
    {"step": 1, "instruction": "Stand or sit facing East, the direction of new beginnings."},
    {"step": 2, "instruction": "Inhale facing East, inviting illumination and clarity."},
    {"step": 3, "instruction": "Turn to South. Inhale, inviting warmth and innocence."},
    {"step": 4, "instruction": "Turn to West. Inhale, inviting introspection and transformation."},
    {"step": 5, "instruction": "Turn to North. Inhale, inviting wisdom and endurance."},
    {"step": 6, "instruction": "Return to East. Complete 4 full cycles of all directions."}
  ]'::jsonb,
  NULL,
  'nature_forest',
  'native_america',
  false,
  'Based on the Medicine Wheel, sacred to many Native American traditions. Each direction carries specific spiritual meaning.',
  ARRAY['Balance and harmony', 'Connection to nature', 'Spiritual grounding', 'Perspective'],
  ARRAY['Face actual directions if possible', 'Honor each direction equally', 'Best done outdoors'],
  '{"inhale": 4, "hold": 2, "exhale": 4, "rest": 2}'::jsonb
),
(
  'Eagle Breath',
  'Expansive breathing invoking the spirit of the eagle for vision and freedom.',
  'breathing',
  'intermediate',
  10,
  '[
    {"step": 1, "instruction": "Stand tall with arms at sides."},
    {"step": 2, "instruction": "Inhale slowly, raising arms out to sides like wings."},
    {"step": 3, "instruction": "At full inhale, arms are fully extended, chest open."},
    {"step": 4, "instruction": "Hold briefly, feeling expansive like an eagle soaring."},
    {"step": 5, "instruction": "Exhale slowly, lowering wings/arms."},
    {"step": 6, "instruction": "Repeat 10 times, feeling freedom and expanded vision."}
  ]'::jsonb,
  NULL,
  'wind',
  'native_america',
  true,
  'The eagle is sacred in many Native traditions, representing connection to Creator and higher perspective.',
  ARRAY['Expands perspective', 'Opens heart and chest', 'Invokes courage', 'Freedom feeling'],
  ARRAY['Move slowly like eagle soaring', 'Look upward at peak of inhale', 'Feel wings, not just arms'],
  '{"inhale": 6, "hold": 2, "exhale": 6, "rest": 0}'::jsonb
);

-- ============================================
-- BRAZILIAN TECHNIQUES
-- ============================================

INSERT INTO exercises (name, description, category, level, duration_minutes, instructions, safety_warning, audio_preset, origin, is_premium, history, benefits, tips, breathing_pattern) VALUES
(
  'Capoeira Ginga Breath',
  'Brazilian martial arts breathing synchronized with the fundamental ginga movement.',
  'movement',
  'intermediate',
  10,
  '[
    {"step": 1, "instruction": "Stand with feet shoulder-width apart."},
    {"step": 2, "instruction": "Step right foot back diagonally, bending both knees."},
    {"step": 3, "instruction": "Inhale as you step back."},
    {"step": 4, "instruction": "Return to center and step left foot back diagonally."},
    {"step": 5, "instruction": "Exhale as you step back with left foot."},
    {"step": 6, "instruction": "Continue the flowing ginga rhythm for 10 minutes."}
  ]'::jsonb,
  NULL,
  'binaural_alpha',
  'brazil',
  true,
  'Ginga is the fundamental movement of Capoeira, the Afro-Brazilian martial art disguised as dance. Breathing powers the continuous movement.',
  ARRAY['Full body coordination', 'Rhythmic meditation', 'Core strength', 'Playful movement'],
  ARRAY['Keep movement continuous', 'Let body swing naturally', 'Add music for authentic feel'],
  '{"inhale": 2, "hold": 0, "exhale": 2, "rest": 0}'::jsonb
),
(
  'Holotropic Light',
  'Simplified version of Holotropic breathwork for emotional release.',
  'breathing',
  'advanced',
  20,
  '[
    {"step": 1, "instruction": "Lie down in a safe, comfortable space."},
    {"step": 2, "instruction": "Begin breathing faster and deeper than normal - circular breath."},
    {"step": 3, "instruction": "No pause between inhale and exhale."},
    {"step": 4, "instruction": "Continue for 15-20 minutes without stopping."},
    {"step": 5, "instruction": "Allow any emotions or sensations to arise and release."},
    {"step": 6, "instruction": "Slow down gradually and rest for 10 minutes after."}
  ]'::jsonb,
  'Powerful technique that can bring up intense emotions. Best with a trained facilitator. Not for pregnancy, heart conditions, or mental health conditions.',
  'binaural_theta',
  'brazil',
  true,
  'Developed by Stanislav Grof (Czech-American, working in Brazil). Uses accelerated breathing to access non-ordinary states of consciousness.',
  ARRAY['Emotional release', 'Trauma healing', 'Expanded awareness', 'Deep insights'],
  ARRAY['Have someone present', 'Journal after', 'Allow several hours for integration'],
  '{"inhale": 2, "hold": 0, "exhale": 2, "rest": 0, "special": "holotropic"}'::jsonb
);

-- ============================================
-- AUSTRALIAN ABORIGINAL TECHNIQUES
-- ============================================

INSERT INTO exercises (name, description, category, level, duration_minutes, instructions, safety_warning, audio_preset, origin, is_premium, history, benefits, tips, breathing_pattern) VALUES
(
  'Didgeridoo Circular Breath',
  'Aboriginal breathing technique for continuous airflow. Originally for playing didgeridoo.',
  'breathing',
  'advanced',
  15,
  '[
    {"step": 1, "instruction": "Sit comfortably with good posture."},
    {"step": 2, "instruction": "Fill your cheeks with air like a chipmunk."},
    {"step": 3, "instruction": "While pushing air out with cheeks, quickly inhale through nose."},
    {"step": 4, "instruction": "Practice the coordination: cheeks push out while nose breathes in."},
    {"step": 5, "instruction": "Start with short sessions - this takes weeks to master."},
    {"step": 6, "instruction": "Eventually create continuous airflow without pausing."}
  ]'::jsonb,
  'May cause dizziness at first. Practice seated.',
  'nature_ocean',
  'australia',
  true,
  'Essential technique for playing the didgeridoo, the world''s oldest wind instrument (40,000+ years). Studies show didgeridoo playing treats sleep apnea.',
  ARRAY['Treats sleep apnea', 'Strengthens breathing muscles', 'Unique meditation', 'Ancient connection'],
  ARRAY['Be patient - takes weeks to learn', 'Practice with a straw in water first', 'Hum to simulate didgeridoo'],
  '{"inhale": 0.5, "hold": 0, "exhale": 4, "rest": 0}'::jsonb
),
(
  'Dreamtime Breath',
  'Aboriginal-inspired meditation breathing for connecting with the eternal Dreamtime.',
  'breathing',
  'beginner',
  15,
  '[
    {"step": 1, "instruction": "Sit or lie on the earth if possible (grass, sand, soil)."},
    {"step": 2, "instruction": "Close eyes and feel your body connecting with the land."},
    {"step": 3, "instruction": "Breathe slowly, imagining roots growing from your body into earth."},
    {"step": 4, "instruction": "With each inhale, draw up ancient wisdom from the land."},
    {"step": 5, "instruction": "With each exhale, release your story into the earth."},
    {"step": 6, "instruction": "Rest in timeless awareness, connected to all ancestors."}
  ]'::jsonb,
  NULL,
  'schumann',
  'australia',
  true,
  'Inspired by Aboriginal concept of Dreamtime (Tjukurpa) - the eternal time of creation where past, present, and future coexist.',
  ARRAY['Deep grounding', 'Connection to ancestors', 'Timeless awareness', 'Earth healing'],
  ARRAY['Best practiced directly on earth', 'Barefoot enhances connection', 'Sunset or sunrise ideal'],
  '{"inhale": 6, "hold": 3, "exhale": 6, "rest": 3}'::jsonb
);

-- ============================================
-- SCANDINAVIAN/VIKING TECHNIQUES
-- ============================================

INSERT INTO exercises (name, description, category, level, duration_minutes, instructions, safety_warning, audio_preset, origin, is_premium, history, benefits, tips, breathing_pattern) VALUES
(
  'Berserker Breath',
  'Norse warrior breathing for courage and fearlessness. Controlled intensity.',
  'breathing',
  'advanced',
  5,
  '[
    {"step": 1, "instruction": "Stand in a strong warrior stance."},
    {"step": 2, "instruction": "Take 20 rapid, powerful breaths through nose."},
    {"step": 3, "instruction": "Each breath should be forceful but controlled."},
    {"step": 4, "instruction": "On the last exhale, let out a primal roar or growl."},
    {"step": 5, "instruction": "Inhale deeply and hold for as long as possible."},
    {"step": 6, "instruction": "Exhale and return to calm. Feel powerful but centered."}
  ]'::jsonb,
  'Very intense practice. Not for heart conditions or high blood pressure. Do not drive after.',
  'binaural_alpha',
  'scandinavia',
  true,
  'Inspired by Norse Berserker warriors who used breath and meditation to enter altered states of consciousness before battle.',
  ARRAY['Overcomes fear', 'Builds courage', 'Increases energy', 'Mental strength'],
  ARRAY['Channel energy constructively', 'End with grounding', 'Use before challenges, not daily'],
  '{"inhale": 1, "hold": 0, "exhale": 1, "rest": 0, "special": "rapid", "cycles": 20}'::jsonb
),
(
  'Hygge Breath',
  'Danish cozy breathing for contentment and present-moment comfort.',
  'breathing',
  'beginner',
  10,
  '[
    {"step": 1, "instruction": "Create a cozy environment - candles, blanket, warm drink nearby."},
    {"step": 2, "instruction": "Sit or lie comfortably, allowing body to fully relax."},
    {"step": 3, "instruction": "Breathe slowly and naturally, no effort or counting."},
    {"step": 4, "instruction": "With each exhale, let go of any need to be anywhere else."},
    {"step": 5, "instruction": "Feel deep contentment with this moment exactly as it is."},
    {"step": 6, "instruction": "Continue for 10 minutes, cultivating coziness and gratitude."}
  ]'::jsonb,
  NULL,
  'nature_rain',
  'scandinavia',
  false,
  'Hygge (pronounced hoo-ga) is the Danish concept of cozy contentment. This breathing practice embodies the hygge lifestyle.',
  ARRAY['Cultivates contentment', 'Reduces stress', 'Present moment awareness', 'Self-care ritual'],
  ARRAY['Create a cozy atmosphere first', 'No phones or distractions', 'Do in autumn/winter evenings'],
  '{"inhale": 4, "hold": 0, "exhale": 6, "rest": 2}'::jsonb
);

-- ============================================
-- THAI TECHNIQUES
-- ============================================

INSERT INTO exercises (name, description, category, level, duration_minutes, instructions, safety_warning, audio_preset, origin, is_premium, history, benefits, tips, breathing_pattern) VALUES
(
  'Ruesri Dat Ton Breath',
  'Thai yoga breathing for self-healing. Ancient hermit sage techniques.',
  'breathing',
  'intermediate',
  15,
  '[
    {"step": 1, "instruction": "Sit in diamond pose (kneeling with buttocks on heels)."},
    {"step": 2, "instruction": "Place hands on thighs, spine straight."},
    {"step": 3, "instruction": "Inhale slowly, arching back and looking upward."},
    {"step": 4, "instruction": "Hold briefly at the top."},
    {"step": 5, "instruction": "Exhale, rounding spine and tucking chin to chest."},
    {"step": 6, "instruction": "Coordinate breath with spinal movement for 10 minutes."}
  ]'::jsonb,
  NULL,
  'tibetan_bowl',
  'thailand',
  true,
  'Ruesri Dat Ton is Thai yoga, practiced by hermit sages (ruesri) for thousands of years. Combines breath with self-massage and movement.',
  ARRAY['Spinal flexibility', 'Internal organ massage', 'Energy flow', 'Self-healing'],
  ARRAY['Movement and breath should be smooth', 'Listen to your body', 'Can add self-massage between rounds'],
  '{"inhale": 4, "hold": 1, "exhale": 4, "rest": 1}'::jsonb
),
(
  'Anapanasati',
  'Thai Buddhist mindfulness of breathing. Direct from Buddha''s teachings.',
  'breathing',
  'beginner',
  20,
  '[
    {"step": 1, "instruction": "Sit in a stable, comfortable meditation posture."},
    {"step": 2, "instruction": "Close eyes and bring attention to natural breathing."},
    {"step": 3, "instruction": "Simply observe breath at the nostrils or belly."},
    {"step": 4, "instruction": "When mind wanders, gently return to breath."},
    {"step": 5, "instruction": "No need to control breath - just observe its natural rhythm."},
    {"step": 6, "instruction": "Continue for 20-45 minutes, deepening concentration."}
  ]'::jsonb,
  NULL,
  'silence',
  'thailand',
  false,
  'Anapanasati is the Buddha''s core meditation teaching, preserved in Thai forest tradition. "Ana" means inhale, "apana" means exhale, "sati" means mindfulness.',
  ARRAY['Develops concentration', 'Calms mind', 'Insight meditation', 'Reduces suffering'],
  ARRAY['Don''t control the breath', 'Use noting: "in, out"', 'Practice daily for best results'],
  '{"inhale": 4, "hold": 0, "exhale": 4, "rest": 0}'::jsonb
);

-- ============================================
-- MONGOLIAN TECHNIQUES
-- ============================================

INSERT INTO exercises (name, description, category, level, duration_minutes, instructions, safety_warning, audio_preset, origin, is_premium, history, benefits, tips, breathing_pattern) VALUES
(
  'Khoomei Breathing',
  'Mongolian throat singing breathing technique for deep vibration and meditation.',
  'sensory',
  'advanced',
  15,
  '[
    {"step": 1, "instruction": "Sit comfortably with spine straight."},
    {"step": 2, "instruction": "Take a deep breath filling belly completely."},
    {"step": 3, "instruction": "Begin a low drone sound from deep in throat."},
    {"step": 4, "instruction": "Shape mouth to create different overtone harmonics."},
    {"step": 5, "instruction": "Feel vibrations in chest, throat, and head."},
    {"step": 6, "instruction": "Continue for 10-15 minutes, experimenting with sounds."}
  ]'::jsonb,
  'Start gently to avoid straining throat.',
  'om',
  'mongolia',
  true,
  'Khoomei (throat singing) has been practiced by Mongolian nomads for centuries. The breathing technique alone is deeply meditative and healing.',
  ARRAY['Deep vibration therapy', 'Voice strengthening', 'Unique meditation', 'Vagus nerve stimulation'],
  ARRAY['Start with simple humming', 'Drink water before and after', 'The sound matters less than the vibration'],
  '{"inhale": 5, "hold": 0, "exhale": 15, "rest": 2}'::jsonb
),
(
  'Steppe Wind Breath',
  'Mongolian breathing inspired by the vast open steppes. Expansive and grounding.',
  'breathing',
  'beginner',
  10,
  '[
    {"step": 1, "instruction": "Stand or sit facing open space (or visualize vast plains)."},
    {"step": 2, "instruction": "Inhale slowly, imagining the endless horizon expanding."},
    {"step": 3, "instruction": "Let your awareness expand with the breath to the horizon."},
    {"step": 4, "instruction": "Exhale, feeling grounded like a mountain on the steppe."},
    {"step": 5, "instruction": "Feel both vast and grounded simultaneously."},
    {"step": 6, "instruction": "Continue, connecting with the spirit of endless space."}
  ]'::jsonb,
  NULL,
  'wind',
  'mongolia',
  false,
  'Inspired by Mongolian nomadic culture where the vast steppe and sky create a unique sense of spaciousness and freedom.',
  ARRAY['Expansive awareness', 'Freedom feeling', 'Grounding', 'Perspective'],
  ARRAY['Best done outdoors', 'Face an open view', 'Feel small and vast at once'],
  '{"inhale": 6, "hold": 2, "exhale": 6, "rest": 2}'::jsonb
);

-- ============================================
-- PERSIAN/SUFI ADDITIONS
-- ============================================

INSERT INTO exercises (name, description, category, level, duration_minutes, instructions, safety_warning, audio_preset, origin, is_premium, history, benefits, tips, breathing_pattern) VALUES
(
  'Whirling Breath',
  'Sufi dervish breathing synchronized with turning. Simplified practice without full spinning.',
  'movement',
  'intermediate',
  10,
  '[
    {"step": 1, "instruction": "Stand with arms crossed over chest, eyes closed."},
    {"step": 2, "instruction": "Take 3 deep breaths, centering yourself."},
    {"step": 3, "instruction": "Open arms wide, right palm up, left palm down."},
    {"step": 4, "instruction": "Begin turning slowly counterclockwise on the spot."},
    {"step": 5, "instruction": "Breathe naturally, letting go of self."},
    {"step": 6, "instruction": "After 3-5 minutes, slow down and sit in stillness."}
  ]'::jsonb,
  'Start very slowly. Stop if dizzy. Keep one foot relatively still as pivot.',
  'solfeggio_852',
  'persia',
  true,
  'From Mevlevi Sufi order founded by Rumi. Whirling is a form of active meditation seeking divine union.',
  ARRAY['Transcendent states', 'Ego dissolution', 'Joy and ecstasy', 'Heart opening'],
  ARRAY['Start with just 1 minute', 'Focus on heart, not head', 'The turning is the prayer'],
  '{"inhale": 3, "hold": 0, "exhale": 3, "rest": 0}'::jsonb
),
(
  'Zikr Breathing',
  'Sufi remembrance breathing with divine names. Heart-centered devotional practice.',
  'breathing',
  'beginner',
  15,
  '[
    {"step": 1, "instruction": "Sit comfortably with hand on heart."},
    {"step": 2, "instruction": "Close eyes and breathe naturally for a minute."},
    {"step": 3, "instruction": "On inhale, silently say a sacred word (Allah, Love, Peace)."},
    {"step": 4, "instruction": "On exhale, let the word resonate in your heart."},
    {"step": 5, "instruction": "Continue rhythmically, word becoming automatic."},
    {"step": 6, "instruction": "Let the remembrance fill your entire being."}
  ]'::jsonb,
  NULL,
  'solfeggio_639',
  'persia',
  false,
  'Zikr (dhikr) means remembrance of the Divine. Central practice in Sufism for polishing the heart and drawing near to God.',
  ARRAY['Heart opening', 'Spiritual connection', 'Inner peace', 'Devotional focus'],
  ARRAY['Use any sacred word meaningful to you', 'The word can become a breath itself', 'Practice with love, not effort'],
  '{"inhale": 4, "hold": 0, "exhale": 4, "rest": 0}'::jsonb
);

-- ============================================
-- MEXICAN/AZTEC TECHNIQUES
-- ============================================

INSERT INTO exercises (name, description, category, level, duration_minutes, instructions, safety_warning, audio_preset, origin, is_premium, history, benefits, tips, breathing_pattern) VALUES
(
  'Temazcal Breath',
  'Mexican sweat lodge breathing for purification and rebirth.',
  'breathing',
  'intermediate',
  15,
  '[
    {"step": 1, "instruction": "Sit in a warm, enclosed space (hot bath, sauna, or warm room)."},
    {"step": 2, "instruction": "Close eyes and connect with the heat around you."},
    {"step": 3, "instruction": "Breathe slowly through nose, accepting the heat."},
    {"step": 4, "instruction": "With each exhale, release toxins and old patterns."},
    {"step": 5, "instruction": "Visualize emerging reborn and purified."},
    {"step": 6, "instruction": "If doing in actual heat, limit to 15-20 minutes."}
  ]'::jsonb,
  'Stay hydrated. Exit heat if feeling unwell. Not for pregnancy or heart conditions.',
  'nature_rain',
  'mexico',
  true,
  'Temazcal is an ancient Mesoamerican sweat lodge ceremony used by Aztec, Maya, and other indigenous peoples for healing and spiritual purification.',
  ARRAY['Detoxification', 'Spiritual rebirth', 'Emotional release', 'Deep purification'],
  ARRAY['Can practice the breath without actual heat', 'Stay well hydrated', 'Rest after'],
  '{"inhale": 5, "hold": 3, "exhale": 7, "rest": 2}'::jsonb
),
(
  'Sun Salutation Breath',
  'Breathing synchronized with saluting the sun. Honoring Tonatiuh (Aztec sun god).',
  'movement',
  'beginner',
  10,
  '[
    {"step": 1, "instruction": "Face the sun (or east in morning)."},
    {"step": 2, "instruction": "Stand with hands at heart in prayer position."},
    {"step": 3, "instruction": "Inhale, raising arms overhead, looking up."},
    {"step": 4, "instruction": "Exhale, bowing forward, hands toward earth."},
    {"step": 5, "instruction": "Inhale, rise halfway with flat back."},
    {"step": 6, "instruction": "Exhale, fold. Inhale, rise to standing. Repeat."}
  ]'::jsonb,
  NULL,
  'solfeggio_528',
  'mexico',
  false,
  'Combines Aztec sun worship traditions with flowing movement. The sun was considered the source of all life and energy.',
  ARRAY['Energizing', 'Full body stretch', 'Connects with nature', 'Morning ritual'],
  ARRAY['Best done at sunrise', 'Face the actual sun', 'Move with breath, not ahead of it'],
  '{"inhale": 4, "hold": 0, "exhale": 4, "rest": 0}'::jsonb
);
