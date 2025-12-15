-- ============================================
-- Premium Subscription System
-- ============================================

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly', 'lifetime')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  store TEXT CHECK (store IN ('app_store', 'play_store', 'stripe')),
  store_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own subscription
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert/update subscriptions (via webhooks)
CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- Mark premium exercises
-- Free exercises: basic breathing techniques
UPDATE exercises SET is_premium = false WHERE name IN (
  'Box Breathing',
  '4-7-8 Breathing', 
  'Diaphragmatic Breathing',
  'Resonant Breathing',
  'Physiological Sigh'
);

-- Premium exercises: everything else
UPDATE exercises SET is_premium = true WHERE name NOT IN (
  'Box Breathing',
  '4-7-8 Breathing',
  'Diaphragmatic Breathing', 
  'Resonant Breathing',
  'Physiological Sigh'
);

-- Mark premium audio presets (add column if needed)
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS premium_audio_only BOOLEAN DEFAULT false;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Function to check if user has active premium
CREATE OR REPLACE FUNCTION is_user_premium(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM subscriptions 
    WHERE user_id = check_user_id 
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
