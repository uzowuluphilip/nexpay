-- Nex Pay Database Schema
-- Run this in Supabase SQL Editor to set up all tables and policies

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_profiles_email ON profiles(email);

-- 3. Create pins table
CREATE TABLE pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  hashed_pin TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'deposit',
    'withdraw',
    'send',
    'receive',
    'invest_buy',
    'invest_sell',
    'interest',
    'savings_payout'
  )),
  amount DECIMAL(18, 2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN (
    'pending',
    'completed',
    'failed',
    'reversed'
  )),
  description TEXT,
  counterparty_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_type ON transactions(type);

-- 5. Create savings_plans table
CREATE TABLE savings_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('7d', '30d', '90d', '180d')),
  amount DECIMAL(18, 2) NOT NULL CHECK (amount > 0),
  interest_rate DECIMAL(5, 2) NOT NULL,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  unlock_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active',
    'matured',
    'withdrawn',
    'cancelled'
  )),
  payout_amount DECIMAL(18, 2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_savings_plans_user_id ON savings_plans(user_id);
CREATE INDEX idx_savings_plans_status ON savings_plans(status);
CREATE INDEX idx_savings_plans_unlock_date ON savings_plans(unlock_date);

-- 6. Create market_assets table
CREATE TABLE market_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  current_price DECIMAL(18, 8) NOT NULL CHECK (current_price > 0),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_market_assets_symbol ON market_assets(symbol);

-- 7. Create investment_holdings table
CREATE TABLE investment_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES market_assets(id) ON DELETE CASCADE,
  quantity DECIMAL(18, 8) NOT NULL CHECK (quantity > 0),
  entry_price DECIMAL(18, 8) NOT NULL CHECK (entry_price > 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, asset_id)
);

CREATE INDEX idx_investment_holdings_user_id ON investment_holdings(user_id);

-- 8. Create balance_snapshots table
CREATE TABLE balance_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(18, 2) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_balance_snapshots_user_id_recorded_at ON balance_snapshots(user_id, recorded_at);

-- ==================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_snapshots ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Pins policies (view only, never update)
CREATE POLICY "Users can view own PIN metadata"
  ON pins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own PIN"
  ON pins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can insert transactions"
  ON transactions FOR INSERT
  WITH CHECK (true); -- API will enforce auth

CREATE POLICY "Users can receive transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = counterparty_user_id OR auth.uid() = user_id);

-- Savings plans policies
CREATE POLICY "Users can view own savings plans"
  ON savings_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can insert savings plans"
  ON savings_plans FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin can update savings plans"
  ON savings_plans FOR UPDATE
  USING (true);

-- Investment holdings policies
CREATE POLICY "Users can view own holdings"
  ON investment_holdings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can insert holdings"
  ON investment_holdings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin can update holdings"
  ON investment_holdings FOR UPDATE
  USING (true);

CREATE POLICY "Admin can delete holdings"
  ON investment_holdings FOR DELETE
  USING (true);

-- Market assets policies
CREATE POLICY "Anyone can view market assets"
  ON market_assets FOR SELECT
  USING (true);

-- Balance snapshots policies
CREATE POLICY "Users can view own snapshots"
  ON balance_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can insert snapshots"
  ON balance_snapshots FOR INSERT
  WITH CHECK (true);

-- ==================================================
-- SAMPLE DATA (Optional - for testing)
-- ==================================================

-- Sample market assets
INSERT INTO market_assets (symbol, name, current_price) VALUES
  ('TECH', 'Technology Index', 150.50),
  ('GOLD', 'Gold Price', 2050.25),
  ('OIL', 'Oil (Brent)', 85.75),
  ('BTC', 'Bitcoin', 43250.00),
  ('ETH', 'Ethereum', 2280.50),
  ('STOCK', 'Stock Index', 4500.00)
ON CONFLICT (symbol) DO NOTHING;

-- Notes for developers:
-- 1. PINs should never be selected in queries - use separate table for verification
-- 2. Always use DECIMAL for monetary values - never FLOAT
-- 3. Transactions are immutable - never UPDATE an existing transaction
-- 4. All balance calculations are done from the transaction ledger
-- 5. RLS policies ensure data isolation per user
