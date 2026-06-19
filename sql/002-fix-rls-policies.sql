-- Fix RLS Policies for NexPay
-- These updates allow authenticated users to perform necessary operations

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admin can insert transactions" ON transactions;
DROP POLICY IF EXISTS "Admin can insert savings plans" ON savings_plans;
DROP POLICY IF EXISTS "Admin can update savings plans" ON savings_plans;
DROP POLICY IF EXISTS "Admin can insert holdings" ON investment_holdings;
DROP POLICY IF EXISTS "Admin can update holdings" ON investment_holdings;
DROP POLICY IF EXISTS "Admin can delete holdings" ON investment_holdings;
DROP POLICY IF EXISTS "Admin can insert snapshots" ON balance_snapshots;

-- Profiles - Users should be able to insert and update their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Pins - Users should be able to insert their own PIN
DROP POLICY IF EXISTS "Users can insert own PIN" ON pins;
CREATE POLICY "Users can insert own PIN"
  ON pins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Transactions - Users should be able to insert their own transactions
-- (In a real app, this would be done by the API with proper validation)
CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Transactions - Allow reading transactions where user is sender or receiver
DROP POLICY IF EXISTS "Users can receive transactions" ON transactions;
CREATE POLICY "Users can view own or received transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = counterparty_user_id);

-- Savings plans - Users should be able to insert and update their own plans
CREATE POLICY "Users can insert own savings plans"
  ON savings_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own savings plans"
  ON savings_plans FOR UPDATE
  USING (auth.uid() = user_id);

-- Investment holdings - Users should be able to insert and update their own holdings
CREATE POLICY "Users can insert own holdings"
  ON investment_holdings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own holdings"
  ON investment_holdings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own holdings"
  ON investment_holdings FOR DELETE
  USING (auth.uid() = user_id);

-- Balance snapshots - Users should be able to insert their own snapshots
CREATE POLICY "Users can insert own snapshots"
  ON balance_snapshots FOR INSERT
  WITH CHECK (auth.uid() = user_id);
