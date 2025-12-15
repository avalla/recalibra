-- ============================================
-- Remove Duplicate Exercises
-- ============================================

-- Remove duplicate Lion's Breath (keep the oldest one by created_at)
DELETE FROM exercises 
WHERE name = 'Lion''s Breath' 
AND id NOT IN (
  SELECT id FROM exercises 
  WHERE name = 'Lion''s Breath' 
  ORDER BY created_at ASC 
  LIMIT 1
);

-- Remove duplicate Nadi Shodhana if exists
DELETE FROM exercises 
WHERE name = 'Nadi Shodhana' 
AND id NOT IN (
  SELECT id FROM exercises 
  WHERE name = 'Nadi Shodhana' 
  ORDER BY created_at ASC 
  LIMIT 1
);
