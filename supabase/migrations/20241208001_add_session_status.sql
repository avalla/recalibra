-- ============================================
-- Add session status tracking
-- ============================================

-- Session status enum
CREATE TYPE session_status AS ENUM (
  'started',      -- Session started but not completed
  'completed',    -- Session completed successfully
  'abandoned',    -- User closed before completing
  'paused'        -- Session was paused (may resume later)
);

-- Add status column to sessions
ALTER TABLE sessions 
ADD COLUMN status session_status NOT NULL DEFAULT 'started';

-- Update existing sessions: if completed_at is not null, mark as completed
UPDATE sessions SET status = 'completed' WHERE completed_at IS NOT NULL;
