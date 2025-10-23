-- Create secure RPC function for updating wallet balances
CREATE OR REPLACE FUNCTION update_wallet_balance(
  wallet_id uuid,
  amount_change numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_current_balance numeric;
BEGIN
  -- Verify wallet ownership
  SELECT user_id, balance INTO v_user_id, v_current_balance
  FROM wallets
  WHERE id = wallet_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;
  
  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized wallet access';
  END IF;
  
  -- Prevent negative balances
  IF v_current_balance + amount_change < 0 THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  -- Update balance
  UPDATE wallets
  SET balance = balance + amount_change,
      updated_at = now()
  WHERE id = wallet_id;
END;
$$;