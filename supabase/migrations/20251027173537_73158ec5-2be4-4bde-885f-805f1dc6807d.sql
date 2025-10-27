-- ============================================
-- CRITICAL SECURITY FIX: Transaction Immutability
-- ============================================

-- Add RLS policies to prevent direct transaction modifications
CREATE POLICY "Transactions are immutable"
ON transactions
FOR UPDATE
TO authenticated
USING (false);

COMMENT ON POLICY "Transactions are immutable" ON transactions IS
'Transaction records are permanent financial audit logs and cannot be modified after creation for compliance.';

CREATE POLICY "Transactions cannot be deleted"
ON transactions
FOR DELETE
TO authenticated
USING (false);

COMMENT ON POLICY "Transactions cannot be deleted" ON transactions IS
'Transaction records are permanent financial records and cannot be deleted for audit compliance.';

-- ============================================
-- CRITICAL SECURITY FIX: Wallet Data Retention
-- ============================================

CREATE POLICY "Wallets cannot be deleted"
ON wallets
FOR DELETE
TO authenticated
USING (false);

COMMENT ON POLICY "Wallets cannot be deleted" ON wallets IS
'Wallet records are financial records tied to transactions and cannot be deleted for audit compliance.';

-- ============================================
-- CRITICAL SECURITY FIX: Profile Data Protection
-- ============================================

CREATE POLICY "Profiles cannot be directly deleted"
ON profiles
FOR DELETE
TO authenticated
USING (false);

COMMENT ON POLICY "Profiles cannot be directly deleted" ON profiles IS
'Profiles are automatically deleted when the corresponding auth.users record is deleted via CASCADE. Direct deletion is not permitted.';

-- ============================================
-- CRITICAL SECURITY FIX: Row-Level Locking for Balance Updates
-- ============================================

-- Replace the existing update_wallet_balance function with one that uses FOR UPDATE
CREATE OR REPLACE FUNCTION public.update_wallet_balance(
  wallet_id uuid,
  amount_change numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_current_balance numeric;
BEGIN
  -- Lock the row for update to prevent race conditions
  -- This blocks other transactions from reading/writing this row
  -- until the current transaction commits or rolls back
  SELECT user_id, balance INTO v_user_id, v_current_balance
  FROM wallets
  WHERE id = wallet_id
  FOR UPDATE;  -- Critical: Adds exclusive lock to prevent double-spending
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;
  
  -- Verify wallet ownership
  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized wallet access';
  END IF;
  
  -- Check balance constraint (now protected by lock)
  IF v_current_balance + amount_change < 0 THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  -- Update balance (still holding the lock)
  UPDATE wallets
  SET balance = balance + amount_change,
      updated_at = now()
  WHERE id = wallet_id;
  
  -- Lock released automatically on COMMIT
END;
$$;

COMMENT ON FUNCTION public.update_wallet_balance IS
'Updates wallet balance with row-level locking to prevent race conditions and double-spending attacks';

-- ============================================
-- NEW: Secure Transaction Status Management
-- ============================================

-- Function to complete a transaction (only from pending to completed)
CREATE OR REPLACE FUNCTION public.complete_transaction(transaction_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_status transaction_status;
BEGIN
  -- Get transaction details
  SELECT user_id, status INTO v_user_id, v_status
  FROM transactions 
  WHERE id = transaction_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;
  
  -- Verify transaction ownership
  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized transaction access';
  END IF;
  
  -- Only pending transactions can be completed
  IF v_status != 'pending' THEN
    RAISE EXCEPTION 'Only pending transactions can be completed';
  END IF;
  
  -- Update transaction status
  UPDATE transactions
  SET status = 'completed', 
      completed_at = now()
  WHERE id = transaction_id;
END;
$$;

COMMENT ON FUNCTION public.complete_transaction IS
'Securely completes a pending transaction with proper authorization checks';

-- Function to fail a transaction
CREATE OR REPLACE FUNCTION public.fail_transaction(
  transaction_id uuid, 
  failure_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_status transaction_status;
BEGIN
  -- Get transaction details
  SELECT user_id, status INTO v_user_id, v_status
  FROM transactions 
  WHERE id = transaction_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;
  
  -- Verify transaction ownership
  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized transaction access';
  END IF;
  
  -- Only pending transactions can be failed
  IF v_status != 'pending' THEN
    RAISE EXCEPTION 'Only pending transactions can be marked as failed';
  END IF;
  
  -- Update transaction status
  UPDATE transactions
  SET status = 'failed', 
      notes = failure_reason,
      completed_at = now()
  WHERE id = transaction_id;
END;
$$;

COMMENT ON FUNCTION public.fail_transaction IS
'Securely marks a pending transaction as failed with reason';

-- ============================================
-- DEFENSE IN DEPTH: Add database constraint
-- ============================================

-- Ensure balances can never go negative at database level
ALTER TABLE wallets 
ADD CONSTRAINT positive_balance_check 
CHECK (balance >= 0);

COMMENT ON CONSTRAINT positive_balance_check ON wallets IS
'Database-level constraint to prevent negative balances as a defense-in-depth measure';

-- ============================================
-- AUDIT LOGGING: Create transaction audit log
-- ============================================

CREATE TABLE IF NOT EXISTS transaction_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL,
  old_status transaction_status,
  new_status transaction_status,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE transaction_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs"
ON transaction_audit_log
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

COMMENT ON TABLE transaction_audit_log IS
'Audit trail for all transaction status changes to ensure accountability';

-- ============================================
-- TRIGGER: Automatic audit logging
-- ============================================

CREATE OR REPLACE FUNCTION log_transaction_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO transaction_audit_log (
      transaction_id,
      user_id,
      action,
      old_status,
      new_status,
      notes
    ) VALUES (
      NEW.id,
      NEW.user_id,
      'status_change',
      OLD.status,
      NEW.status,
      NEW.notes
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER transaction_status_audit_trigger
AFTER UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION log_transaction_status_change();

COMMENT ON TRIGGER transaction_status_audit_trigger ON transactions IS
'Automatically logs all transaction status changes for audit trail';