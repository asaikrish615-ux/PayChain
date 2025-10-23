-- Add RLS policies for exchange_rates table to restrict modifications to service role only
-- This prevents unauthorized manipulation of exchange rates

-- Policy to allow service role to INSERT exchange rates
CREATE POLICY "Service role can insert rates" ON exchange_rates
FOR INSERT
TO service_role
WITH CHECK (true);

-- Policy to allow service role to UPDATE exchange rates
CREATE POLICY "Service role can update rates" ON exchange_rates
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Policy to allow service role to DELETE exchange rates
CREATE POLICY "Service role can delete rates" ON exchange_rates
FOR DELETE
TO service_role
USING (true);