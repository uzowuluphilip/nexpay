-- Complete RLS Policies for all tables
-- Ensures all authenticated users can perform necessary operations

-- Drop all existing problematic policies that use "true" or "Admin"
DROP POLICY IF EXISTS "Admin can insert snapshots" ON balance_snapshots;

-- Ensure all policies allow authenticated users to perform operations on their own data

-- Profiles - Complete set
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can select own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Pins - Complete set
DROP POLICY IF EXISTS "Users can view own PIN metadata" ON pins;
DROP POLICY IF EXISTS "Users can insert own PIN" ON pins;

CREATE POLICY "Users can view own PIN"
  ON pins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own PIN"
  ON pins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own PIN"
  ON pins FOR UPDATE
  USING (auth.uid() = user_id);

-- Transactions - Complete set
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Admin can insert transactions" ON transactions;
DROP POLICY IF EXISTS "Users can receive transactions" ON transactions;
DROP POLICY IF EXISTS "Users can view own or received transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = counterparty_user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id);

-- Savings plans - Complete set
DROP POLICY IF EXISTS "Users can view own savings plans" ON savings_plans;
DROP POLICY IF EXISTS "Admin can insert savings plans" ON savings_plans;
DROP POLICY IF EXISTS "Admin can update savings plans" ON savings_plans;
DROP POLICY IF EXISTS "Users can insert own savings plans" ON savings_plans;
DROP POLICY IF EXISTS "Users can update own savings plans" ON savings_plans;

CREATE POLICY "Users can view own savings plans"
  ON savings_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own savings plans"
  ON savings_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own savings plans"
  ON savings_plans FOR UPDATE
  USING (auth.uid() = user_id);

-- Investment holdings - Complete set
DROP POLICY IF EXISTS "Users can view own holdings" ON investment_holdings;
DROP POLICY IF EXISTS "Admin can insert holdings" ON investment_holdings;
DROP POLICY IF EXISTS "Admin can update holdings" ON investment_holdings;
DROP POLICY IF EXISTS "Admin can delete holdings" ON investment_holdings;
DROP POLICY IF EXISTS "Users can insert own holdings" ON investment_holdings;
DROP POLICY IF EXISTS "Users can update own holdings" ON investment_holdings;
DROP POLICY IF EXISTS "Users can delete own holdings" ON investment_holdings;

CREATE POLICY "Users can view own holdings"
  ON investment_holdings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own holdings"
  ON investment_holdings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own holdings"
  ON investment_holdings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own holdings"
  ON investment_holdings FOR DELETE
  USING (auth.uid() = user_id);

-- Balance snapshots - Complete set
DROP POLICY IF EXISTS "Users can view own snapshots" ON balance_snapshots;
DROP POLICY IF EXISTS "Admin can insert snapshots" ON balance_snapshots;

CREATE POLICY "Users can view own snapshots"
  ON balance_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own snapshots"
  ON balance_snapshots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Market assets - Allow all authenticated users to view
DROP POLICY IF EXISTS "Anyone can view market assets" ON market_assets;

CREATE POLICY "Authenticated users can view market assets"
  ON market_assets FOR SELECT
  USING (auth.role() = 'authenticated');
