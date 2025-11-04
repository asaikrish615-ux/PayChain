-- Create AI chat usage tracking table for rate limiting
CREATE TABLE IF NOT EXISTS ai_chat_usage (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_requests integer DEFAULT 0 NOT NULL,
  daily_tokens integer DEFAULT 0 NOT NULL,
  last_request_at timestamptz DEFAULT now() NOT NULL,
  daily_reset_at timestamptz DEFAULT (date_trunc('day', now()) + interval '1 day') NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE ai_chat_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own AI chat usage"
  ON ai_chat_usage FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role manages usage (edge functions use service role)
CREATE POLICY "Service role manages AI chat usage"
  ON ai_chat_usage FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create monitoring view for high usage alerts
CREATE VIEW ai_usage_alerts AS
SELECT 
  user_id,
  daily_requests,
  daily_tokens,
  last_request_at,
  CASE 
    WHEN daily_requests > 80 THEN 'WARNING'
    WHEN daily_requests >= 100 THEN 'CRITICAL'
    ELSE 'NORMAL'
  END as alert_level
FROM ai_chat_usage
WHERE daily_requests > 50
ORDER BY daily_requests DESC;