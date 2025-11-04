-- Fix security definer view issue
-- Drop the existing view
DROP VIEW IF EXISTS public.ai_usage_alerts;

-- Recreate the view with explicit SECURITY INVOKER
-- This ensures the view respects the querying user's RLS policies
CREATE VIEW public.ai_usage_alerts
WITH (security_invoker = true)
AS
SELECT 
  user_id,
  daily_requests,
  daily_tokens,
  last_request_at,
  CASE
    WHEN daily_requests >= 100 THEN 'CRITICAL'
    WHEN daily_requests > 80 THEN 'WARNING'
    ELSE 'NORMAL'
  END AS alert_level
FROM ai_chat_usage
WHERE daily_requests > 50
ORDER BY daily_requests DESC;